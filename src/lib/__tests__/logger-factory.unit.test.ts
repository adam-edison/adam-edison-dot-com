import { describe, it, expect, beforeEach } from 'vitest';
import { logger, InMemoryLogger } from '@/lib/logger/Logger';

describe('Logger', () => {
  let testLogger: InMemoryLogger;

  beforeEach(() => {
    // In test environment, logger is InMemoryLogger
    testLogger = logger as InMemoryLogger;
  });

  it('should be InMemoryLogger in test environment', () => {
    expect(logger).toBeInstanceOf(InMemoryLogger);
    expect(logger.error).toBeInstanceOf(Function);
    expect(logger.warn).toBeInstanceOf(Function);
    expect(logger.info).toBeInstanceOf(Function);
    expect(logger.debug).toBeInstanceOf(Function);
  });

  it('should log error messages to memory', () => {
    testLogger.error('Test error message', { key: 'value' });

    const errorLogs = testLogger.getErrorLogs();
    expect(errorLogs).toHaveLength(1);
    expect(errorLogs[0].message).toBe('Test error message');
    expect(errorLogs[0].level).toBe('ERROR');
    expect(errorLogs[0].args).toEqual([{ key: 'value' }]);
  });

  it('should log warn messages to memory', () => {
    testLogger.warn('Test warning', 'extra arg');

    const warnLogs = testLogger.getWarnLogs();
    expect(warnLogs).toHaveLength(1);
    expect(warnLogs[0].message).toBe('Test warning');
    expect(warnLogs[0].level).toBe('WARN');
    expect(warnLogs[0].args).toEqual(['extra arg']);
  });

  it('should clear logs', () => {
    testLogger.error('Error 1');
    testLogger.warn('Warning 1');
    testLogger.info('Info 1');

    expect(testLogger.logs).toHaveLength(3);

    testLogger.clear();

    expect(testLogger.logs).toHaveLength(0);
    expect(testLogger.getErrorLogs()).toHaveLength(0);
  });

  it('should filter logs by level', () => {
    testLogger.error('Error message');
    testLogger.warn('Warning message');
    testLogger.info('Info message');
    testLogger.debug('Debug message');

    expect(testLogger.getLogsByLevel('ERROR')).toHaveLength(1);
    expect(testLogger.getLogsByLevel('WARN')).toHaveLength(1);
    expect(testLogger.getLogsByLevel('INFO')).toHaveLength(1);
    expect(testLogger.getLogsByLevel('DEBUG')).toHaveLength(1);
  });

  it('should be the same instance everywhere', () => {
    // Same instance used everywhere
    expect(logger).toBe(testLogger);
  });
});
