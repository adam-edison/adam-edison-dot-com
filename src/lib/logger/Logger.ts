/* eslint-disable no-console */
export class Logger {
  protected formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `${timestamp} ${level} ${message}`;
  }

  error(message: string, ...args: unknown[]): void {
    console.error(this.formatMessage('ERROR', message), ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(this.formatMessage('WARN', message), ...args);
  }

  info(message: string, ...args: unknown[]): void {
    console.info(this.formatMessage('INFO', message), ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message), ...args);
    }
  }
}

export interface LogEntry {
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  message: string;
  args: unknown[];
  timestamp: Date;
}

export class InMemoryLogger extends Logger {
  public logs: LogEntry[] = [];

  error(message: string, ...args: unknown[]): void {
    this.logs.push({
      level: 'ERROR',
      message,
      args,
      timestamp: new Date()
    });
  }

  warn(message: string, ...args: unknown[]): void {
    this.logs.push({
      level: 'WARN',
      message,
      args,
      timestamp: new Date()
    });
  }

  info(message: string, ...args: unknown[]): void {
    this.logs.push({
      level: 'INFO',
      message,
      args,
      timestamp: new Date()
    });
  }

  debug(message: string, ...args: unknown[]): void {
    this.logs.push({
      level: 'DEBUG',
      message,
      args,
      timestamp: new Date()
    });
  }

  clear(): void {
    this.logs = [];
  }

  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  getErrorLogs(): LogEntry[] {
    return this.getLogsByLevel('ERROR');
  }

  getWarnLogs(): LogEntry[] {
    return this.getLogsByLevel('WARN');
  }
}

// Factory function that creates appropriate logger based on environment
function createLogger(): Logger {
  if (process.env.NODE_ENV === 'test') {
    return new InMemoryLogger();
  }
  return new Logger();
}

// Single logger instance used everywhere
export const logger = createLogger();
