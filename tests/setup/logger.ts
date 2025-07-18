import { beforeEach, afterEach } from 'vitest';
import { logger, InMemoryLogger } from '@/shared/Logger';

// Automatically clear logger before and after each test
beforeEach(() => {
  (logger as InMemoryLogger).clear();
});

afterEach(() => {
  (logger as InMemoryLogger).clear();
});
