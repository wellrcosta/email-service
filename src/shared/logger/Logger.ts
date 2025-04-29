export class Logger {
  private static format(
    level: string,
    message: string,
    meta?: Record<string, any>
  ) {
    const log = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta || {}),
    };
    return JSON.stringify(log);
  }

  static info(message: string, meta?: Record<string, any>) {
    console.log(this.format("info", message, meta));
  }

  static warn(message: string, meta?: Record<string, any>) {
    console.warn(this.format("warn", message, meta));
  }

  static error(message: string, meta?: Record<string, any>) {
    console.error(this.format("error", message, meta));
  }
}
