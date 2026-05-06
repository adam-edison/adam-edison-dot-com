import { describe, expect, test } from 'vitest';
import { InputSanitizer } from './InputSanitizer';

describe('InputSanitizer', () => {
  test('escapes HTML-significant characters to entities', () => {
    expect(InputSanitizer.sanitize('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');
  });

  test('escapes ampersands and quotes', () => {
    expect(InputSanitizer.sanitize(`Tom & Jerry "say" hi`)).toBe('Tom &amp; Jerry &quot;say&quot; hi');
  });

  test('trims leading and trailing whitespace before escaping', () => {
    expect(InputSanitizer.sanitize('   hello world   ')).toBe('hello world');
  });
});
