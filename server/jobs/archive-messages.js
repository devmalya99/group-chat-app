const { neon } = require("@neondatabase/serverless");
const { getArchiveConfig } = require("./archive-config");

let isRunning = false;

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  return neon(databaseUrl);
}

/**
 * Moves one batch of expired live messages into archived_messages.
 * Atomic single statement: DELETE … RETURNING + INSERT (safe on neon-http).
 * Loop progress uses deleted count (not insert count) so ON CONFLICT cannot
 * stall the job while more live rows still match the cutoff.
 */
async function archiveMessageBatch(sql, cutoffIso, batchSize) {
  const rows = await sql`
    WITH deleted AS (
      DELETE FROM messages
      WHERE id IN (
        SELECT id
        FROM messages
        WHERE created_at < ${cutoffIso}::timestamptz
        ORDER BY created_at ASC
        LIMIT ${batchSize}
      )
      RETURNING
        id,
        room_id,
        type,
        text,
        media_key,
        media_content_type,
        original_file_name,
        sender_id,
        created_at
    ),
    inserted AS (
      INSERT INTO archived_messages (
        id,
        room_id,
        type,
        text,
        media_key,
        media_content_type,
        original_file_name,
        sender_id,
        created_at,
        archived_at
      )
      SELECT
        id,
        room_id,
        type,
        text,
        media_key,
        media_content_type,
        original_file_name,
        sender_id,
        created_at,
        NOW()
      FROM deleted
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    )
    SELECT id FROM deleted
  `;

  return rows.length;
}

/**
 * Archives messages older than the configured cutoff in batches.
 *
 * Concurrency: in-process mutex only. Safe for a single server.js process.
 * Cross-process advisory locks would need a persistent DB pool (not neon-http).
 */
async function runMessageArchive(options = {}) {
  if (isRunning) {
    return {
      skipped: true,
      reason: "already_running",
      archivedCount: 0,
      batches: 0,
      cutoffIso: null,
    };
  }

  isRunning = true;

  try {
    const config = getArchiveConfig();
    const batchSize = options.batchSize ?? config.batchSize;
    const cutoffMs = options.cutoffMs ?? config.cutoffMs;
    const cutoffIso = new Date(Date.now() - cutoffMs).toISOString();
    const sql = getSql();

    let archivedCount = 0;
    let batches = 0;

    for (;;) {
      const deleted = await archiveMessageBatch(sql, cutoffIso, batchSize);
      if (deleted === 0) {
        break;
      }

      archivedCount += deleted;
      batches += 1;
    }

    return {
      skipped: false,
      archivedCount,
      batches,
      cutoffIso,
      batchSize,
      cutoffMs,
    };
  } finally {
    isRunning = false;
  }
}

module.exports = {
  runMessageArchive,
  archiveMessageBatch,
};
