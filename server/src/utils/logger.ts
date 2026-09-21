export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export interface LogContext {
  correlationId?: string;
  userId?: string;
  role?: string;
  path?: string;
  method?: string;
  [key: string]: any;
}

class Logger {
  private formatLog(level: LogLevel, message: string, meta: LogContext = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      correlationId: meta.correlationId || "N/A",
      ...meta,
    };

    if (process.env.NODE_ENV === "production") {
      return JSON.stringify(logEntry);
    }

    // Human-readable colored output for local development
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
    return `[${timestamp}] [${level}] [CorrID: ${logEntry.correlationId}] ${message} ${metaStr}`;
  }

  info(message: string, meta?: LogContext) {
    console.log(this.formatLog(LogLevel.INFO, message, meta));
  }

  warn(message: string, meta?: LogContext) {
    console.warn(this.formatLog(LogLevel.WARN, message, meta));
  }

  error(message: string, meta?: LogContext) {
    console.error(this.formatLog(LogLevel.ERROR, message, meta));
  }

  debug(message: string, meta?: LogContext) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.formatLog(LogLevel.DEBUG, message, meta));
    }
  }
}

export const logger = new Logger();
