import { describe, expect, it } from 'vitest';
import type { TimeSolverError } from '../src/errors.js';
import { getString } from '../src/format.js';
import { isValid, parse } from '../src/parse.js';

/**
 * A format string is tokenized once and kept, and `parse` compiles a matcher
 * into the same entry on first use. Nothing about that is visible in a single
 * call, so what needs defending is every way a format can be reached twice: two
 * calls of the same function, the render and parse paths in either order, a
 * format that renders but cannot be parsed, and a malformed one that must fail
 * the same way every time rather than being remembered as either.
 */
describe('a format used more than once', () => {
  const SAMPLE = new Date(2024, 2, 17, 14, 30, 45, 123);
  const STAMP = 'YYYY-MM-DD HH:mm:ss';

  it('renders the same string every time', () => {
    expect(getString(SAMPLE, STAMP)).toBe('2024-03-17 14:30:45');
    expect(getString(SAMPLE, STAMP)).toBe('2024-03-17 14:30:45');
    expect(getString(new Date(2020, 0, 1, 2, 3, 4), STAMP)).toBe('2020-01-01 02:03:04');
  });

  it('parses after rendering, and renders after parsing', () => {
    const format = 'DD/MM/YYYY';

    expect(getString(SAMPLE, format)).toBe('17/03/2024');
    expect(getString(parse('17/03/2024', format), format)).toBe('17/03/2024');
    expect(getString(SAMPLE, format)).toBe('17/03/2024');
    expect(isValid('17/03/2024', format)).toBe(true);
  });

  it('keeps refusing a format that renders but cannot be parsed', () => {
    // Over the matcher's token limit: the parts compile and are cached, and the
    // matcher never does, so the entry has to stay usable for rendering.
    const long = 'YYYY'.repeat(513);

    expect(getString(SAMPLE, long)).toHaveLength(2052);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        parse('2024'.repeat(513), long);
        expect.unreachable('should have thrown');
      } catch (error) {
        expect((error as TimeSolverError).code).toBe('INVALID_FORMAT');
        expect((error as TimeSolverError).message).toMatch(/limited to 512 tokens/);
      }
    }

    expect(getString(SAMPLE, long)).toHaveLength(2052);
  });

  it('keeps refusing a malformed format', () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect(() => getString(SAMPLE, 'MD')).toThrowError(/is ambiguous/);
      expect(() => getString(SAMPLE, '!!!')).toThrowError(/contains no format tokens/);
      expect(() => isValid('anything', 'YYYY]')).toThrowError(/unmatched square bracket/);
    }
  });

  it('stays correct across more distinct formats than it keeps', () => {
    // Formats are normally literals in source, so only a caller building them
    // from data gets past the limit. Correctness must not depend on which side
    // of it a format falls.
    const rendered = new Set<string>();

    for (let index = 0; index < 200; index += 1) {
      rendered.add(getString(SAMPLE, `YYYY[-${index}-]MM`));
    }

    expect(rendered.size).toBe(200);
    expect(rendered.has('2024-0-03')).toBe(true);
    expect(getString(SAMPLE, STAMP)).toBe('2024-03-17 14:30:45');
    expect(getString(SAMPLE, 'YYYY[-0-]MM')).toBe('2024-0-03');
  });

  it('tells two formats apart when one is a prefix of the other', () => {
    expect(getString(SAMPLE, 'YYYY')).toBe('2024');
    expect(getString(SAMPLE, 'YYYY-MM')).toBe('2024-03');
    expect(getString(SAMPLE, 'YYYY')).toBe('2024');
  });

  it('does not let a 1.x name and its canonical form share an entry', () => {
    // Both compile to the same parts, but they arrive as different strings and
    // must not be conflated with a third that differs only in case.
    expect(getString(SAMPLE, 'HH:MM:SS')).toBe('14:30:45');
    expect(getString(SAMPLE, 'HH:mm:ss')).toBe('14:30:45');
    expect(getString(SAMPLE, 'hh:mm:ss')).toBe('02:30:45');
    expect(getString(SAMPLE, 'HH:MM:SS')).toBe('14:30:45');
  });
});
