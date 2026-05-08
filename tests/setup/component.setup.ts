import './configurationForTesting';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { logger, InMemoryLogger } from '@/shared/Logger';

beforeEach(() => {
  (logger as InMemoryLogger).clear();
});

afterEach(() => {
  cleanup();
  (logger as InMemoryLogger).clear();
});
