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

// Stryker disable next-line Regex: every pattern in the token table is either
// exactly one of these shapes or nothing like them, so anchoring cannot be
// observed. Kept anchored because a future token might need it.
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
  // Stryker disable next-line ConditionalExpression: reported as surviving, but
  // applying the mutation by hand fails two tests with "Cannot read properties
  // of undefined" -- the format-only tokens have no pattern. Stryker's Vitest
  // runner does not attribute that failure back to the mutant.
  if (pattern === undefined || !DIGIT_PATTERN.test(pattern)) {
    return 'none';
  }

  // Stryker disable next-line StringLiteral: only 'variable' is compared by
  // name; the other branch is read as "not none", so its text is unobservable.
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
  // Years before 1 CE are negative. Padding the raw string would produce
  // '00-1' for -1, so the sign is carried separately.
  return value < 0 ? `-${String(-value).padStart(width, '0')}` : String(value).padStart(width, '0');
}

function twelveHour(hour: number): number {
  return hour % HOURS_PER_HALF_DAY || HOURS_PER_HALF_DAY;
}

function offset(fields: DateFields, separator: string): string {
  const total = Math.abs(fields.offsetMinutes);
  const sign = fields.offsetMinutes < 0 ? '-' : '+';

  return `${sign}${pad(Math.floor(total / MINUTES_PER_HOUR), PAIR)}${separator}${pad(total % MINUTES_PER_HOUR, PAIR)}`;
}

// Stryker disable ArithmeticOperator: reported as surviving, but applying either
// mutation by hand makes this module throw while loading -- monthName(-1) is out
// of range -- and Stryker's Vitest runner does not attribute a module-load
// failure to any test. Verified by hand: 492 of 720 tests fail.
const MONTH_NAME_LIST = Array.from({ length: 12 }, (_, index) => monthName(index + 1));
const MONTH_ABBREVIATION_LIST = Array.from({ length: 12 }, (_, index) =>
  monthAbbreviation(index + 1),
);
// Stryker restore ArithmeticOperator
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
//
// Inside an escape, `]]` is a literal `]` and a lone `]` closes the escape, so
// the grammar can express both delimiters: `'[[]'` renders `[` and `'[a]]b]'`
// renders `a]b`. The two alternatives in the body cannot both match the same
// character -- one excludes `]`, the other requires it -- so the repetition
// stays linear no matter how many brackets a caller passes.
const TOKEN_PATTERN =
  /\[((?:[^\]]|\]\])*)\]|(YYYY|YY|MMMM|MMM|MM|M|dddd|ddd|DD|D|HH|H|hh|h|mm|m|SSS|ss|s|A|a|Q|ZZ|Z)/g;

const V1_TIME_SEGMENT = /HH:MM:SS/g;

/**
 * Every format name 1.x accepted, across the published 1.2.0 build and the
 * later repository state that added the `DD`-first family. 1.x uppercased the
 * whole string and used `MM` for both month and minute; v2 tokens are
 * case-sensitive, so these names are translated to canonical tokens when a
 * format matches one and is not already a v2 format in its own right.
 *
 * One delimited string rather than a table: membership is the only question
 * asked of it, `|` cannot occur in a name, and a substring search needs no
 * `Object.hasOwn` guard against inherited keys. It is also a third of the size
 * in the bundle, which for a compatibility shim most callers never touch is
 * the difference worth having.
 */
const V1_FORMATS =
  '|YYYY|YYYYMM|YYYYMMDD|YYYY/MM/DD|YYYY-MM-DD|YYYY.MM.DD|MMDDYYYY|DDMMYYYY' +
  '|MM/DD/YYYY|MM-DD-YYYY|MM.DD.YYYY|YYYY/MM/DD HH:MM:SS|YYYY/MM/DD HH:MM:SS.SSS' +
  '|YYYY-MM-DD HH:MM:SS|YYYY-MM-DD HH:MM:SS.SSS|YYYY.MM.DD HH:MM:SS' +
  '|YYYY.MM.DD HH:MM:SS.SSS|YYYYMMDD HH:MM:SS|YYYYMMDD HH:MM:SS.SSS' +
  '|MM/DD/YYYY HH:MM:SS|MM/DD/YYYY HH:MM:SS.SSS|MM-DD-YYYY HH:MM:SS' +
  '|MM-DD-YYYY HH:MM:SS.SSS|MM.DD.YYYY HH:MM:SS|MM.DD.YYYY HH:MM:SS.SSS' +
  '|HH:MM:SS|HH:MM:SS.SSS|DD/MM/YYYY|DD-MM-YYYY|DD.MM.YYYY|DD/MM/YYYY HH:MM:SS' +
  '|DD/MM/YYYY HH:MM:SS.SSS|DD-MM-YYYY HH:MM:SS|DD-MM-YYYY HH:MM:SS.SSS' +
  '|DD.MM.YYYY HH:MM:SS|DD.MM.YYYY HH:MM:SS.SSS|';

/** A letter left over once tokens and escaped text are removed. */
const STRAY_LETTER = /[A-Za-z]/;

/**
 * Whether a format is already canonical: every letter in it belongs to a token
 * or to escaped literal text.
 *
 * This is what decides between the two readings a handful of strings have.
 * `'hh:mm:ss'` is a v2 format meaning 12-hour, minute, second, and it is also
 * the 1.x name `'HH:MM:SS'` in lower case, which meant 24-hour. The tokens win,
 * because they are what the token table documents and what a v2 caller wrote.
 * `'yyyy-mm-dd hh:mm:ss'` is not canonical -- `yyyy` and `dd` are not tokens at
 * all -- so it can only have been meant as the 1.x name, and is still
 * translated. No 1.x name loses its own meaning: every one of them writes
 * seconds as `SS`, which is not a token in any case.
 */
function readsAsTokens(format: string): boolean {
  return !STRAY_LETTER.test(format.replace(TOKEN_PATTERN, ''));
}

/**
 * Translate a v1 format name to canonical tokens.
 *
 * Case-insensitive on the v1 names, so `'yyyy-mm-dd hh:mm:ss'` keeps working;
 * every other string, and every string that is already a v2 format, is returned
 * untouched and tokenized as written.
 */
export function normalizeFormat(format: string): string {
  if (typeof format !== 'string') {
    throw new TimeSolverError(
      'INVALID_FORMAT',
      `Format must be a string, received ${typeof format}.`,
    );
  }

  if (readsAsTokens(format)) {
    return format;
  }

  const upper = format.toUpperCase();

  if (!V1_FORMATS.includes(`|${upper}|`)) {
    return format;
  }

  return upper.replace(V1_TIME_SEGMENT, 'HH:mm:ss');
}

/**
 * How a format part collides with a variable-width numeric token in front of
 * it, named for the error message, or `undefined` when it does not.
 *
 * A variable-width token matches one digit or two, so anything that can begin
 * with a digit leaves the boundary between them undecided. `'YYYYMD'` renders
 * 12 January 2024 as `'2024112'`, which reads equally well as month 11 day 2;
 * `'M0M'` is no better, and it is slower to fail, because its matcher --
 * `^(\d{1,2})0(\d{1,2})$` -- gives every group two viable widths at every
 * position, so a run of digits that does not match costs 2^n steps.
 */
function digitCollision(part: FormatPart): string | undefined {
  if (part.kind === 'token') {
    const spec: TokenSpec = TOKENS[part.name];

    return digitWidth(spec.pattern) === 'none' ? undefined : `"${part.name}"`;
  }

  return /^\d/.test(part.text) ? `the digit "${part.text.slice(0, 1)}"` : undefined;
}

/**
 * Split a format string into literals and tokens.
 *
 * @throws {TimeSolverError} `INVALID_FORMAT` for an empty string, a string with
 *   no tokens at all, an unmatched `[` / `]`, or a variable-width token running
 *   straight into a digit.
 */
export function tokenize(format: string): FormatPart[] {
  if (format.length === 0) {
    throw new TimeSolverError('INVALID_FORMAT', 'Format string is empty.');
  }

  const parts: FormatPart[] = [];
  let cursor = 0;

  // Flags rather than counts: only whether either occurred is ever read, and a
  // count invites a mutation nothing can observe.
  let sawToken = false;
  let sawEscape = false;

  /**
   * Text that arrived outside an escape. A bracket here is a typo -- an escape
   * that was never opened or never closed -- so it is refused rather than
   * rendered; the escaped form checked below is where a literal bracket goes.
   */
  const pushText = (text: string): void => {
    if (/[[\]]/.test(text)) {
      throw new TimeSolverError(
        'INVALID_FORMAT',
        `${JSON.stringify(format)} has an unmatched square bracket.`,
      );
    }

    parts.push({ kind: 'literal', text });
  };

  for (const match of format.matchAll(TOKEN_PATTERN)) {
    const [raw, escaped, token] = match;

    if (match.index > cursor) {
      pushText(format.slice(cursor, match.index));
    }

    if (escaped === undefined) {
      // The alternation matches either the escape group or the token group, so
      // reaching here means `token` is one of the table's keys.
      const name = token as TokenName;
      parts.push({ kind: 'token', name });
      sawToken = true;
    } else {
      sawEscape = true;
      // Stryker disable next-line EqualityOperator,ConditionalExpression: an
      // empty escape would push a literal of empty text, which renders and
      // matches as nothing, so skipping it is unobservable.
      if (escaped.length > 0) {
        parts.push({ kind: 'literal', text: escaped.replaceAll(']]', ']') });
      }
    }

    cursor = match.index + raw.length;
  }

  // Stryker disable next-line EqualityOperator,ConditionalExpression: as above,
  // a trailing literal of empty text is unobservable.
  if (cursor < format.length) {
    pushText(format.slice(cursor));
  }

  if (!sawToken && !sawEscape) {
    throw new TimeSolverError(
      'INVALID_FORMAT',
      `${JSON.stringify(format)} contains no format tokens. Escape literal text with square brackets, for example [today].`,
    );
  }

  let previous: FormatPart | undefined;

  for (const part of parts) {
    // One rule, whether the digit arrives as a token or as literal text.
    if (previous?.kind === 'token') {
      const before: TokenSpec = TOKENS[previous.name];
      const collision =
        digitWidth(before.pattern) === 'variable' ? digitCollision(part) : undefined;

      if (collision !== undefined) {
        throw new TimeSolverError(
          'INVALID_FORMAT',
          `${JSON.stringify(format)} is ambiguous: "${previous.name}" matches one or two digits and runs straight into ${collision}. Separate them, or use the fixed-width token.`,
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
 * Ceiling on the capture groups a generated matcher may hold. V8 refuses to
 * compile a pattern past a few thousand groups -- with "Stack overflow" first,
 * whose threshold depends on the stack left, so it is not even deterministic,
 * and "Too many captures" beyond about 32,000 -- and it reports that as a raw
 * `SyntaxError`, which carries none of this library's error codes. A format
 * with more tokens than this is a caller bug, so it is refused the same way
 * every other malformed format is. The longest format anyone writes by hand has
 * around a dozen tokens; the linearity probe in test/fuzz.test.ts uses 320.
 */
const MAX_MATCHER_TOKENS = 512;

/**
 * Build an anchored regular expression that matches exactly the strings a
 * format can produce, plus the token order of its capture groups.
 *
 * @throws {TimeSolverError} `INVALID_FORMAT` when the format contains a
 *   format-only token such as `Z`, or more tokens than a matcher can hold.
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

    if (tokens.length > MAX_MATCHER_TOKENS) {
      throw new TimeSolverError(
        'INVALID_FORMAT',
        `A parseable format is limited to ${MAX_MATCHER_TOKENS} tokens, and this one has more. Shorten it: a longer format cannot be compiled into a matcher.`,
      );
    }
  }

  return { matcher: new RegExp(`${source}$`), tokens };
}

/** A format string, worked out once. */
export interface CompiledFormat {
  readonly parts: readonly FormatPart[];
  /**
   * Anchored matcher and capture order, filled in the first time this format is
   * parsed. `getString` never needs it, so it is not built for a format that
   * is only ever rendered.
   */
  matcher?: { matcher: RegExp; tokens: TokenName[] };
}

/**
 * How many compiled formats to keep.
 *
 * Formats are almost always literals in source, so a handful covers an entire
 * application; the limit is here for the caller who builds format strings from
 * data, and it is enforced by clearing rather than by evicting one entry,
 * because a cache this small has nothing to gain from tracking use order.
 */
const CACHE_LIMIT = 64;

const compiled = new Map<string, CompiledFormat>();

/**
 * Tokenize a format, reusing the result for a format already seen.
 *
 * Re-deriving it was around 40% of a `getString` call and 40% of a `parse`
 * call, measured over 200,000 iterations of `'YYYY-MM-DD HH:mm:ss'`: the same
 * string was uppercased, scanned for tokens, checked for stray brackets and
 * ambiguity, and -- for `parse` -- compiled into a fresh `RegExp`, on every
 * single call.
 *
 * Only successful compilations are cached. A malformed format throws from
 * `tokenize`, which is the cold path by definition, and its message names the
 * format, so nothing is gained by remembering it.
 *
 * @throws {TimeSolverError} `INVALID_FORMAT` for anything {@link tokenize} or
 *   {@link normalizeFormat} refuses.
 */
export function compileFormat(format: string): CompiledFormat {
  const hit = compiled.get(format);

  if (hit !== undefined) {
    return hit;
  }

  const entry: CompiledFormat = { parts: tokenize(normalizeFormat(format)) };

  // Stryker disable next-line EqualityOperator,ConditionalExpression: the
  // threshold cannot be observed through the API. Every format compiles to the
  // same parts whether it was cached or not, so only memory use changes, and no
  // test can see that.
  if (compiled.size >= CACHE_LIMIT) {
    compiled.clear();
  }

  compiled.set(format, entry);

  return entry;
}

/** Record a matched capture into the parse draft. */
export function readToken(name: TokenName, draft: ParseDraft, raw: string): void {
  const spec: TokenSpec = TOKENS[name];

  spec.read?.(draft, raw);
}
