const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_BATCH_SIZE = 1000;
const DEFAULT_CRON = "0 3 * * *";
const DEFAULT_TZ = "Asia/Kolkata";

function parsePositiveInt(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function getArchiveConfig() {
  return {
    cutoffMs: parsePositiveInt(
      process.env.MESSAGE_ARCHIVE_CUTOFF_MS,
      ONE_DAY_MS,
    ),
    batchSize: parsePositiveInt(
      process.env.MESSAGE_ARCHIVE_BATCH_SIZE,
      DEFAULT_BATCH_SIZE,
    ),
    cronExpression: process.env.MESSAGE_ARCHIVE_CRON?.trim() || DEFAULT_CRON,
    timezone: process.env.MESSAGE_ARCHIVE_TZ?.trim() || DEFAULT_TZ,
  };
}

module.exports = {
  ONE_DAY_MS,
  DEFAULT_BATCH_SIZE,
  DEFAULT_CRON,
  DEFAULT_TZ,
  getArchiveConfig,
};
