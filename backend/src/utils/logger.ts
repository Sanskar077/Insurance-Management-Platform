/**
 * Minimal leveled logger — a thin, dependency-free wrapper over console that
 * adds ISO timestamps and levels so log lines are grep-able and consistent.
 * HTTP access logging stays with morgan (app.ts); this covers application
 * events (startup, unexpected errors, warnings).
 */

function format(level: string, message: string): string {
  return `[${new Date().toISOString()}] ${level} ${message}`;
}

export const logger = {
  info(message: string): void {
    console.log(format('INFO ', message));
  },

  warn(message: string): void {
    console.warn(format('WARN ', message));
  },

  error(message: string, err?: unknown): void {
    console.error(format('ERROR', message));
    if (err !== undefined) {
      console.error(err);
    }
  },
};
