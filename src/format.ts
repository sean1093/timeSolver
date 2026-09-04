import { type DateInput, toDate } from './coerce.js';
import { compileFormat, fieldsOf, formatToken } from './tokens.js';

/** Format used when `getString` is called without one, as in v1. */
export const DEFAULT_FORMAT = 'YYYYMMDD';

/**
 * Render a date as a string.
 *
 * @param date - A `Date`, epoch milliseconds, or a string `Date` can parse.
 * @param format - A token string such as `'YYYY-MM-DD HH:mm:ss'`. All 36 v1
 *   format names still work, in any case. Wrap literal text in square
 *   brackets: `'YYYY [at] HH:mm'`.
 * @returns The formatted string.
 * @throws {TimeSolverError} `INVALID_DATE` for unreadable input,
 *   `INVALID_FORMAT` for a format with no tokens or an unmatched bracket. v1
 *   returned the string `'[timeSolver] Input Type Error'` instead, which
 *   silently corrupted output.
 *
 * @example
 * getString(new Date(2024, 2, 17), 'YYYY-MM-DD'); // '2024-03-17'
 * getString(new Date(2024, 2, 17), 'ddd, D MMM YYYY'); // 'Sun, 17 Mar 2024'
 */
export function getString(date: DateInput, format: string = DEFAULT_FORMAT): string {
  const fields = fieldsOf(toDate(date));
  const { parts } = compileFormat(format);
  let output = '';

  for (const part of parts) {
    output += part.kind === 'literal' ? part.text : formatToken(part.name, fields);
  }

  return output;
}
