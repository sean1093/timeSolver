/**
 * Error codes carried by every {@link TimeSolverError}.
 *
 * - `INVALID_DATE` — the input could not be read as a date, or does not match a format.
 * - `INVALID_UNIT` — the time unit is not one of the supported names or aliases.
 * - `INVALID_FORMAT` — the format string is malformed (a caller bug, not bad data).
 * - `INVALID_ARGUMENT` — an argument is outside its documented domain.
 */
export type TimeSolverErrorCode =
  | 'INVALID_DATE'
  | 'INVALID_UNIT'
  | 'INVALID_FORMAT'
  | 'INVALID_ARGUMENT';

/**
 * The only error type this library throws.
 *
 * v1 wrote to `console.error` and returned `null`, which callers then
 * dereferenced. v2 throws instead, so failures surface at the call site.
 * Use {@link isValid} when a boolean is wanted rather than an exception.
 */
export class TimeSolverError extends Error {
  readonly code: TimeSolverErrorCode;

  constructor(code: TimeSolverErrorCode, message: string) {
    super(`[timeSolver] ${message}`);
    // Stryker disable next-line StringLiteral: not API; see docs/support.md
    this.name = 'TimeSolverError';
    this.code = code;
  }
}
