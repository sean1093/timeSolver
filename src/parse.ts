import { type DateInput, toDate } from './coerce.js';
import { TimeSolverError } from './errors.js';
import {
  buildMatcher,
  fieldsOf,
  formatToken,
  normalizeFormat,
  type ParseDraft,
  readToken,
  tokenize,
} from './tokens.js';

const HOURS_PER_HALF_DAY = 12;

function resolveHour(draft: ParseDraft): number {
  if (draft.hour24 !== undefined) {
    return draft.hour24;
  }
  if (draft.hour12 === undefined) {
    return 0;
  }

  const base = draft.hour12 % HOURS_PER_HALF_DAY;

  return draft.meridiem === 'pm' ? base + HOURS_PER_HALF_DAY : base;
}

/**
 * Parse a string against an exact format.
 *
 * Strict in both directions: the input must match the format with no leftover
 * characters, and the resulting date must render back to the same string. That
 * round trip is what rejects impossible dates such as `'31-02-2020'` and
 * accepts real ones such as `'2020-02-29'` — v1's hand-written regexes did the
 * opposite. Components the format omits default to 1970-01-01T00:00:00.000
 * local time.
 *
 * @param input - The string to parse.
 * @param format - A token string, or any v1 format name.
 * @returns A new `Date` in the host time zone.
 * @throws {TimeSolverError} `INVALID_ARGUMENT` when `input` is not a string,
 *   `INVALID_FORMAT` for a malformed format or one containing a format-only
 *   token such as `Z`, `INVALID_DATE` when the input does not match.
 *
 * @example
 * parse('17/03/2024', 'DD/MM/YYYY'); // 2024-03-17T00:00:00 local
 * parse('31/02/2024', 'DD/MM/YYYY'); // throws INVALID_DATE
 */
export function parse(input: string, format: string): Date {
  if (typeof input !== 'string') {
    throw new TimeSolverError(
      'INVALID_ARGUMENT',
      // Stryker disable next-line StringLiteral: not API; see docs/support.md
      `parse expects a string input, received ${typeof input}.`,
    );
  }

  const parts = tokenize(normalizeFormat(format));
  const { matcher, tokens } = buildMatcher(parts);
  const match = matcher.exec(input);

  if (match === null) {
    throw new TimeSolverError(
      'INVALID_DATE',
      `${JSON.stringify(input)} does not match format ${JSON.stringify(format)}.`,
    );
  }

  const draft: ParseDraft = {};

  // Every capture group in a generated matcher is mandatory, so a match means
  // every group participated. The cast records that; there is no runtime case
  // where a group is absent, which mutation testing confirmed by showing a
  // guard here could never fail.
  const captured = match.slice(1) as string[];

  for (const [index, name] of tokens.entries()) {
    readToken(name, draft, captured[index] as string);
  }

  // Build from a safe anchor: `new Date(year, ...)` maps years 0-99 into the
  // 1900s, and starting on day 1 keeps `setFullYear` from overflowing a month.
  const date = new Date(2000, 0, 1);
  date.setFullYear(draft.year ?? 1970, (draft.month ?? 1) - 1, draft.day ?? 1);
  date.setHours(resolveHour(draft), draft.minute ?? 0, draft.second ?? 0, draft.millisecond ?? 0);

  const fields = fieldsOf(date);

  for (const [index, name] of tokens.entries()) {
    if (formatToken(name, fields) !== match[index + 1]) {
      throw new TimeSolverError(
        'INVALID_DATE',
        `${JSON.stringify(input)} is not a real date in format ${JSON.stringify(format)}.`,
      );
    }
  }

  return date;
}

/**
 * Check whether an input is a usable date.
 *
 * Never throws for bad data — that is the whole point of the function. It does
 * throw `INVALID_FORMAT` when the *format* itself is malformed, because that is
 * a bug in the calling code rather than a property of the data.
 *
 * @param input - Any value. Without `format`, anything `Date` can parse counts.
 * @param format - Optional token string. When given, `input` must be a string
 *   matching it exactly.
 *
 * @example
 * isValid('2020-02-29', 'YYYY-MM-DD'); // true, and 1.x said false
 * isValid('31-02-2020', 'DD-MM-YYYY'); // false, whatever 1.x said
 * isValid('12:30:00', 'HH:MM:SS');     // true, and 1.x said false
 */
export function isValid(input: DateInput, format?: string): boolean {
  if (format === undefined) {
    try {
      toDate(input);
      return true;
    } catch {
      return false;
    }
  }

  // No guard for a non-string input: `parse` rejects it with INVALID_ARGUMENT,
  // which the catch below turns into `false`. An early return here would be
  // dead code, as mutation testing showed by deleting it with no test failing.
  try {
    parse(input as string, format);
    return true;
  } catch (error) {
    if (error instanceof TimeSolverError && error.code === 'INVALID_FORMAT') {
      throw error;
    }
    return false;
  }
}
