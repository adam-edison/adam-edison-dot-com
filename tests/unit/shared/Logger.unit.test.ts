import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SentryReporter } from '@/shared/observability/SentryReporter';
import { logger, InMemoryLogger, Logger } from '@/shared/Logger';

describe('Logger', () => {
  let testLogger: Logger;

  beforeEach(() => {
    testLogger = logger;
    testLogger.clear();
  });

  it('should be InMemoryLogger in test environment', () => {
    expect(logger).toBeInstanceOf(InMemoryLogger);
    expect(logger.error).toBeInstanceOf(Function);
    expect(logger.warn).toBeInstanceOf(Function);
    expect(logger.info).toBeInstanceOf(Function);
    expect(logger.debug).toBeInstanceOf(Function);
  });

  it('should log error messages to output string', () => {
    testLogger.error('Test error message', { key: 'value' });

    const output = testLogger.getOutput();
    expect(output).toContain('ERROR Test error message');
    expect(output).toContain('{"key":"value"}');
  });

  it('should log warn messages to output string', () => {
    testLogger.warn('Test warning', 'extra arg');

    const output = testLogger.getOutput();
    expect(output).toContain('WARN Test warning');
    expect(output).toContain('extra arg');
  });

  it('should clear logs', () => {
    testLogger.error('Error 1');
    testLogger.warn('Warning 1');
    testLogger.info('Info 1');

    expect(testLogger.getOutput()).toContain('Error 1');
    expect(testLogger.getOutput()).toContain('Warning 1');
    expect(testLogger.getOutput()).toContain('Info 1');

    testLogger.clear();

    expect(testLogger.getOutput()).toBe('');
  });

  it('should store all log levels in unified output', () => {
    testLogger.error('Error message');
    testLogger.warn('Warning message');
    testLogger.info('Info message');
    testLogger.debug('Debug message');

    const output = testLogger.getOutput();
    expect(output).toContain('ERROR Error message');
    expect(output).toContain('WARN Warning message');
    expect(output).toContain('INFO Info message');
    expect(output).toContain('DEBUG Debug message');
  });

  it('should be the same instance everywhere', () => {
    expect(logger).toBe(testLogger);
  });
});

describe('Logger Sentry forwarding', () => {
  let testLogger: Logger;
  let reportErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    testLogger = logger;
    testLogger.clear();
    reportErrorSpy = vi.spyOn(SentryReporter, 'reportError').mockImplementation(() => undefined);
  });

  afterEach(() => {
    reportErrorSpy.mockRestore();
  });

  it('forwards error() calls to the Sentry reporter with the same message and args', () => {
    const error = new Error('boom');

    testLogger.error('API failed', error, { context: 'contact-form' });

    expect(reportErrorSpy.mock.calls).toEqual([['API failed', [error, { context: 'contact-form' }]]]);
  });

  it('forwards error() calls with no Error in args (string-only)', () => {
    testLogger.error('plain error log', 'extra string arg');

    expect(reportErrorSpy.mock.calls).toEqual([['plain error log', ['extra string arg']]]);
  });

  it('does not forward non-error levels', () => {
    testLogger.warn('only a warning');
    testLogger.info('just info');
    testLogger.debug('debug only');

    expect(reportErrorSpy.mock.calls).toEqual([]);
  });
});
