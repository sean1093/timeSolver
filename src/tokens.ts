import { monthAbbreviation, monthName, weekdayAbbreviation, weekdayName } from './calendar.js';
import { TimeSolverError } from './errors.js';
import { MONTHS_PER_UNIT } from './units.js';

/** Local-time components of a date, computed once per format call. */
export interface DateFields {
  readonly year: number;
  /** 1 (January) through 12 (December). */
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;
  /** 0 (Sunday) through 6 (Saturday). */
  readonly weekday: number;
  /** 1 through 4. */
  readonly quarter: number;
  /** Minutes east of UTC, so UTC+08:00 is `480`. */
  readonly offsetMinutes: number;
}

/** Read the local-time components of a date. */
export function fieldsOf(date: Date): DateFields {
  const month = date.getMonth() + 1;

  return {
    year: date.getFullYear(),
    month,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
    millisecond: date.getMilliseconds(),
    weekday: date.getDay(),
    quarter: Math.floor((month - 1) / MONTHS_PER_UNIT.quarter) + 1,
    offsetMinutes: -date.getTimezoneOffset(),
  };
}

/** Components recovered while parsing, before a `Date` is constructed. */
export interface ParseDraft {
  year?: number;
  /** 1 through 12. */
  month?: number;
  day?: number;
  hour24?: number;
  /** 1 through 12, as written; combined with `meridiem` to get the real hour. */
  hour12?: number;
  meridiem?: 'am' | 'pm';
  minute?: number;
  second?: number;
  millisecond?: number;
}

interface TokenSpec {
  /** Render this token from a date's fields. */
  readonly format: (fields: DateFields) => string;
  /**
   * Regular-expression source matching exactly what `format` can emit. Omitted
   * for tokens that render but cannot be parsed back.
   */
  readonly pattern?: string;
  /** Record the matched text into the draft. */
  readonly read?: (draft: ParseDraft, raw: string) => void;
}

const DIGIT_PATTERN = /^(?:\\d\{\d+(?:,\d+)?\}|\[\d-\d\])$/;

/**
 * How many digits a token's pattern can consume, derived from the pattern
 * itself so the two can never drift apart.
 *
 * A variable-width token running straight into another numeric token makes a
 * format ambiguous: `'YYYYMD'` renders 12 January 2024 as `'2024112'`, which
 * reads equally well as month 11 day 2. `tokenize` rejects those formats.
 */
function digitWidth(pattern: string | undefined): 'none' | 'fixed' | 'variable' {
  if (pattern === undefined || !DIGIT_PATTERN.test(pattern)) {
    return 'none';
  }

  return pattern.includes(',') ? 'variable' : 'fixed';
}

const YEAR_DIGITS = 4;
const MILLISECOND_DIGITS = 3;
const PAIR = 2;
const HOURS_PER_HALF_DAY = 12;
/** Two-digit years below this map to 2000+, the rest to 1900+, as POSIX does. */
const TWO_DIGIT_YEAR_PIVOT = 69;
const MINUTES_PER_HOUR = 60;

function pad(value: number, width: number): string {
  return String(value).padStart(width, '0');
}

function twelveHour(hour: number): number {
  return hour % HOURS_PER_HALF_DAY || HOURS_PER_HALF_DAY;
}

function offset(fields: DateFields, separator: string): string {
  const total = Math.abs(fields.offsetMinutes);
  const sign = fields.offsetMinutes < 0 ? '-' : '+';

  return `${sign}${pad(Math.floor(total / MINUTES_PER_HOUR), PAIR)}${separator}${pad(total % MINUTES_PER_HOUR, PAIR)}`;
}

const MONTH_NAME_LIST = Array.from({ length: 12 }, (_, index) => monthName(index + 1));
const MONTH_ABBREVIATION_LIST = Array.from({ length: 12 }, (_, index) =>
  monthAbbreviation(index + 1),
);
const WEEKDAY_NAME_LIST = Array.from({ length: 7 }, (_, index) => weekdayName(index));
const WEEKDAY_ABBREVIATION_LIST = Array.from({ length: 7 }, (_, index) =>
  weekdayAbbreviation(index),
);
const MONTH_NAME_PATTERN = MONTH_NAME_LIST.join('|');
const MONTH_ABBREVIATION_PATTERN = MONTH_ABBREVIATION_LIST.join('|');
const WEEKDAY_NAME_PATTERN = WEEKDAY_NAME_LIST.join('|');
const WEEKDAY_ABBREVIATION_PATTERN = WEEKDAY_ABBREVIATION_LIST.join('|');

/**
 * The single token table behind `getString`, `parse` and `isValid`. Because one
 * table drives all three, any format that renders also parses and validates.
 */
const TOKENS = {
  YYYY: {
    format: (fields) => pad(fields.year, YEAR_DIGITS),
    pattern: '\\d{4}',
    read: (draft, raw) => {
      draft.year = Number(raw);
    },
  },
  YY: {
    format: (fields) => pad(fields.year % 100, PAIR),
    pattern: '\\d{2}',
    read: (draft, raw) => {
      const value = Number(raw);
      draft.year = value < TWO_DIGIT_YEAR_PIVOT ? 2000 + value : 1900 + value;
    },
  },
  MMMM: {
    format: (fields) => monthName(fields.month),
    pattern: MONTH_NAME_PATTERN,
    read: (draft, raw) => {
      draft.month = MONTH_NAME_LIST.indexOf(raw) + 1;
    },
  },
  MMM: {
    format: (fields) => monthAbbreviation(fields.month),
    pattern: MONTH_ABBREVIATION_PATTERN,
    read: (draft, raw) => {
      draft.month = MONTH_ABBREVIATION_LIST.indexOf(raw) + 1;
    },
  },
  MM: {
    format: (fields) => pad(fields.month, PAIR),
    pattern: '\\d{2}',
    read: (draft, raw) => {
      draft.month = Number(raw);
    },
  },
  M: {
    format: (fields) => String(fields.month),
    pattern: '\\d{1,2}',
    read: (draft, raw) => {
      draft.month = Number(raw);
    },
  },
  DD: {
    format: (fields) => pad(fields.day, PAIR),
    pattern: '\\d{2}',
    read: (draft, raw) => {
      draft.day = Number(raw);
    },
  },
  D: {
    format: (fields) => String(fields.day),
    pattern: '\\d{1,2}',
    read: (draft, raw) => {
      draft.day = Number(raw);
    },
  },
  dddd: {
    format: (fields) => weekdayName(fields.weekday),
    pattern: WEEKDAY_NAME_PATTERN,
    // Weekday names carry no new information; the round-trip check in `parse`
    // rejects a name that disagrees with the parsed date.
  },
  ddd: {
    format: (fields) => weekdayAbbreviation(fields.weekday),
    pattern: WEEKDAY_ABBREVIATION_PATTERN,
  },
  HH: {
    format: (fields) => pad(fields.hour, PAIR),
    pattern: '\\d{2}',
    read: (draft, raw) => {
      draft.hour24 = Number(raw);
    },
  },
  H: {
    format: (fields) => String(fields.hour),
    pattern: '\\d{1,2}',
    read: (draft, raw) => {
      draft.hour24 = Number(raw);
    },
  },
  hh: {
    format: (fields) => pad(twelveHour(fields.hour), PAIR),
    pattern: '\\d{2}',
    read: (draft, raw) => {
      draft.hour12 = Number(raw);
    },
  },
  h: {
    format: (fields) => String(twelveHour(fields.hour)),
    pattern: '\\d{1,2}',
    read: (draft, raw) => {
      draft.hour12 = Number(raw);
    },
  },
  mm: {
    format: (fields) => pad(fields.minute, PAIR),
    pattern: '\\d{2}',
    read: (draft, raw) => {
      draft.minute = Number(raw);
    },
  },
  m: {
    format: (fields) => String(fields.minute),
    pattern: '\\d{1,2}',
    read: (draft, raw) => {
      draft.minute = Number(raw);
    },
  },
  ss: {
    format: (fields) => pad(fields.second, PAIR),
    pattern: '\\d{2}',
    read: (draft, raw) => {
      draft.second = Number(raw);
    },
  },
  s: {
    format: (fields) => String(fields.second),
    pattern: '\\d{1,2}',
    read: (draft, raw) => {
      draft.second = Number(raw);
    },
  },
  SSS: {
    format: (fields) => pad(fields.millisecond, MILLISECOND_DIGITS),
    pattern: '\\d{3}',
    read: (draft, raw) => {
      draft.millisecond = Number(raw);
    },
  },
  A: {
    format: (fields) => (fields.hour < HOURS_PER_HALF_DAY ? 'AM' : 'PM'),
    pattern: 'AM|PM',
    read: (draft, raw) => {
      draft.meridiem = raw === 'AM' ? 'am' : 'pm';
    },
  },
  a: {
    format: (fields) => (fields.hour < HOURS_PER_HALF_DAY ? 'am' : 'pm'),
    pattern: 'am|pm',
    read: (draft, raw) => {
      draft.meridiem = raw === 'am' ? 'am' : 'pm';
    },
  },
  Q: {
    format: (fields) => String(fields.quarter),
    pattern: '[1-4]',
  },
  // Offsets describe the host zone, so parsing one would have to shift the
  // instant into a zone this library does not model. Format-only by design.
  ZZ: {
    format: (fields) => offset(fields, ''),
  },
  Z: {
    format: (fields) => offset(fields, ':'),
  },
} as const satisfies Record<string, TokenSpec>;

/** Every recognised format token. */
export type TokenName = keyof typeof TOKENS;

/** One piece of a tokenized format string. */
export type FormatPart =
  | { readonly kind: 'literal'; readonly text: string }
  | { readonly kind: 'token'; readonly name: TokenName };

// Alternatives are ordered longest-first within each letter group so that, for
// example, `MMMM` wins over `MMM` and `MM`.
const TOKEN_PATTERN =
  /\[([^\]]*)\]|(YYYY|YY|MMMM|MMM|MM|M|dddd|ddd|DD|D|HH|H|hh|h|mm|m|SSS|ss|s|A|a|Q|ZZ|Z)/g;

const V1_TIME_SEGMENT = /HH:MM:SS/g;

/**
 * The 36 format names v1 accepted. v1 uppercased the whole string and used `MM`
 * for both month and minute; v2 tokens are case-sensitive, so these names are
 * translated to canonical tokens on an exact match. Anything else is treated as
 * a canonical token string.
 */
const V1_FORMATS: Record<string, true> = {
  YYYY: true,
  YYYYMM: true,
  YYYYMMDD: true,
  'YYYY/MM/DD': true,
  'YYYY-MM-DD': true,
  'YYYY.MM.DD': true,
  MMDDYYYY: true,
  DDMMYYYY: true,
  'MM/DD/YYYY': true,
  'MM-DD-YYYY': true,
  'MM.DD.YYYY': true,
  'YYYY/MM/DD HH:MM:SS': true,
  'YYYY/MM/DD HH:MM:SS.SSS': true,
  'YYYY-MM-DD HH:MM:SS': true,
  'YYYY-MM-DD HH:MM:SS.SSS': true,
  'YYYY.MM.DD HH:MM:SS': true,
  'YYYY.MM.DD HH:MM:SS.SSS': true,
  'YYYYMMDD HH:MM:SS': true,
  'YYYYMMDD HH:MM:SS.SSS': true,
  'MM/DD/YYYY HH:MM:SS': true,
  'MM/DD/YYYY HH:MM:SS.SSS': true,
  'MM-DD-YYYY HH:MM:SS': true,
  'MM-DD-YYYY HH:MM:SS.SSS': true,
  'MM.DD.YYYY HH:MM:SS': true,
  'MM.DD.YYYY HH:MM:SS.SSS': true,
  'HH:MM:SS': true,
  'HH:MM:SS.SSS': true,
  'DD/MM/YYYY': true,
  'DD-MM-YYYY': true,
  'DD.MM.YYYY': true,
  'DD/MM/YYYY HH:MM:SS': true,
  'DD/MM/YYYY HH:MM:SS.SSS': true,
  'DD-MM-YYYY HH:MM:SS': true,
  'DD-MM-YYYY HH:MM:SS.SSS': true,
  'DD.MM.YYYY HH:MM:SS': true,
  'DD.MM.YYYY HH:MM:SS.SSS': true,
};

/**
 * Translate a v1 format name to canonical tokens.
 *
 * Case-insensitive on the v1 names, so `'yyyy-mm-dd hh:mm:ss'` keeps working;
 * every other string is returned untouched and tokenized as written.
 */
export function normalizeFormat(format: string): string {
  if (typeof format !== 'string') {
    throw new TimeSolverError(
      'INVALID_FORMAT',
      `Format must be a string, received ${typeof format}.`,
    );
  }

  const upper = format.toUpperCase();

  if (!Object.hasOwn(V1_FORMATS, upper)) {
    return format;
  }

  return upper.replace(V1_TIME_SEGMENT, 'HH:mm:ss');
}

/**
 * Split a format string into literals and tokens.
 *
 * @throws {TimeSolverError} `INVALID_FORMAT` for an empty string, a string with
 *   no tokens at all, or an unmatched `[` / `]`.
 */
export function tokenize(format: string): FormatPart[] {
  if (format.length === 0) {
    throw new TimeSolverError('INVALID_FORMAT', 'Format string is empty.');
  }

  const parts: FormatPart[] = [];
  let cursor = 0;
  let tokens = 0;
  let escapes = 0;

  for (const match of format.matchAll(TOKEN_PATTERN)) {
    const [raw, escaped, token] = match;

    if (match.index > cursor) {
      parts.push({ kind: 'literal', text: format.slice(cursor, match.index) });
    }

    if (escaped === undefined) {
      // The alternation matches either the escape group or the token group, so
      // reaching here means `token` is one of the table's keys.
      const name = token as TokenName;
      parts.push({ kind: 'token', name });
      tokens += 1;
    } else {
      escapes += 1;
      if (escaped.length > 0) {
        parts.push({ kind: 'literal', text: escaped });
      }
    }

    cursor = match.index + raw.length;
  }

  if (cursor < format.length) {
    parts.push({ kind: 'literal', text: format.slice(cursor) });
  }

  if (tokens === 0 && escapes === 0) {
    throw new TimeSolverError(
      'INVALID_FORMAT',
      `${JSON.stringify(format)} contains no format tokens. Escape literal text with square brackets, for example [today].`,
    );
  }

  let previous: FormatPart | undefined;

  for (const part of parts) {
    if (part.kind === 'literal' && /[[\]]/.test(part.text)) {
      throw new TimeSolverError(
        'INVALID_FORMAT',
        `${JSON.stringify(format)} has an unmatched square bracket.`,
      );
    }

    if (previous?.kind === 'token' && part.kind === 'token') {
      const before: TokenSpec = TOKENS[previous.name];
      const current: TokenSpec = TOKENS[part.name];

      if (digitWidth(before.pattern) === 'variable' && digitWidth(current.pattern) !== 'none') {
        throw new TimeSolverError(
          'INVALID_FORMAT',
          `${JSON.stringify(format)} is ambiguous: "${previous.name}" matches one or two digits and runs straight into "${part.name}". Separate them, or use the fixed-width token.`,
        );
      }
    }

    previous = part;
  }

  return parts;
}

/** Render one token. */
export function formatToken(name: TokenName, fields: DateFields): string {
  return TOKENS[name].format(fields);
}

/**
 * Build an anchored regular expression that matches exactly the strings a
 * format can produce, plus the token order of its capture groups.
 *
 * @throws {TimeSolverError} `INVALID_FORMAT` when the format contains a
 *   format-only token such as `Z`.
 */
export function buildMatcher(parts: readonly FormatPart[]): {
  matcher: RegExp;
  tokens: TokenName[];
} {
  let source = '^';
  const tokens: TokenName[] = [];

  for (const part of parts) {
    if (part.kind === 'literal') {
      source += part.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      continue;
    }

    const spec: TokenSpec = TOKENS[part.name];

    if (spec.pattern === undefined) {
      throw new TimeSolverError(
        'INVALID_FORMAT',
        `Token "${part.name}" can be formatted but not parsed, because this library does not model time zones other than the host zone.`,
      );
    }

    source += `(${spec.pattern})`;
    tokens.push(part.name);
  }

  return { matcher: new RegExp(`${source}$`), tokens };
}

/** Record a matched capture into the parse draft. */
export function readToken(name: TokenName, draft: ParseDraft, raw: string): void {
  const spec: TokenSpec = TOKENS[name];

  spec.read?.(draft, raw);
}
