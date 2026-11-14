const cron = require("node-cron");
const { getArchiveConfig } = require("./archive-config");
const { runMessageArchive } = require("./archive-messages");

async function executeArchiveJob(trigger) {
  const startedAt = new Date().toISOString();
  console.info(`[archive] Starting (${trigger}) at ${startedAt}`);

  try {
    const result = await runMessageArchive();

    if (result.skipped) {
      console.info(`[archive] Skipped (${trigger}): ${result.reason}`);
      return result;
    }

    console.info(
      `[archive] Done (${trigger}): archived=${result.archivedCount} batches=${result.batches} cutoff=${result.cutoffIso}`,
    );
    return result;
  } catch (error) {
    console.error(`[archive] Failed (${trigger})`, error);
    throw error;
  }
}

/**
 * Schedules message archival on this Node process only (server.js).
 * Returns the cron task, or null if the expression is invalid.
 */
function startMessageArchiveCron() {
  const { cronExpression, timezone, cutoffMs, batchSize } = getArchiveConfig();

  if (!cron.validate(cronExpression)) {
    console.error(
      `[archive] Invalid MESSAGE_ARCHIVE_CRON="${cronExpression}" — cron not started`,
    );
    return null;
  }

  const task = cron.schedule(
    cronExpression,
    () => {
      void executeArchiveJob("cron").catch(() => {
        // Error already logged in executeArchiveJob.
      });
    },
    { timezone },
  );

  console.info(
    `[archive] Cron scheduled "${cronExpression}" tz=${timezone} cutoffMs=${cutoffMs} batchSize=${batchSize}`,
  );

  return task;
}

module.exports = {
  executeArchiveJob,
  startMessageArchiveCron,
};
