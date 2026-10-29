type LogMeta = Record<string, unknown>;

function format(level: string, message: string, meta?: LogMeta) {
  const base = `[${level}] ${message}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    console.info(format("INFO", message, meta));
  },
  warn(message: string, meta?: LogMeta) {
    console.warn(format("WARN", message, meta));
  },
  error(message: string, meta?: LogMeta) {
    console.error(format("ERROR", message, meta));
  },
};
