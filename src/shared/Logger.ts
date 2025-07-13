/* eslint-disable no-console */
export class Logger {
  protected formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `${timestamp} ${level} ${message}`;
  }

  static create(): Logger {
    if (process.env.NODE_ENV === 'test') {
      return new InMemoryLogger();
    }
    return new Logger();
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

  clear(): void {
    // No-op for console logger - can't clear console logs
  }

  getOutput(): string {
    // Console logger doesn't store output, return empty string
    return '';
  }
}

export class InMemoryLogger extends Logger {
  private output: string = '';

  private appendToOutput(level: string, message: string, ...args: unknown[]): void {
    const formattedMessage = this.formatMessage(level, message);
    const argsString =
      args.length > 0
        ? ' ' + args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ')
        : '';
    this.output += formattedMessage + argsString + '\n';
  }

  error(message: string, ...args: unknown[]): void {
    this.appendToOutput('ERROR', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.appendToOutput('WARN', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.appendToOutput('INFO', message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    this.appendToOutput('DEBUG', message, ...args);
  }

  clear(): void {
    this.output = '';
  }

  getOutput(): string {
    return this.output;
  }
}

export const logger = Logger.create();
