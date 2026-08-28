import { describe, expect, it } from 'vitest';
import { getString } from '../src/format.js';
import { isValid, parse } from '../src/parse.js';

/**
 * The name tables that back `MMMM`, `MMM`, `dddd` and `ddd` are used twice: to
 * render, and to build the alternation a parser matches against. Rendering was
 * well covered; the parse side was not, so a table built with the wrong offset
 * or joined with the wrong separator went unnoticed.
 *
 * Mutation testing found this: shifting `index + 1` to `index - 1` when building
 * the month list, and joining the weekday list with `''` instead of `'|'`, both
 * survived the entire suite.
 */

describe('month names parse from the same table they render from', () => {
  it.each([
    ['January', 1],
    ['February', 2],
    ['June', 6],
    ['December', 12],
  ])('reads %s as month %i', (name, month) => {
    const parsed = parse(`${name} 2024`, 'MMMM YYYY');

    expect(parsed.getMonth() + 1).toBe(month);
    expect(getString(parsed, 'MMMM')).toBe(name);
  });

  it.each([
    ['Jan', 1],
    ['Mar', 3],
    ['Sep', 9],
    ['Dec', 12],
  ])('reads the abbreviation %s as month %i', (name, month) => {
    const parsed = parse(`17 ${name} 2024`, 'DD MMM YYYY');

    expect(parsed.getMonth() + 1).toBe(month);
    expect(getString(parsed, 'MMM')).toBe(name);
  });

  it('rejects a name that is not in the table', () => {
    expect(isValid('Janvier 2024', 'MMMM YYYY')).toBe(false);
    expect(isValid('17 Xyz 2024', 'DD MMM YYYY')).toBe(false);
    expect(isValid('17 JAN 2024', 'DD MMM YYYY')).toBe(false);
  });

  it('round-trips every month through both widths', () => {
    for (let month = 0; month < 12; month += 1) {
      const date = new Date(2024, month, 15);
      const full = getString(date, 'MMMM YYYY');
      const short = getString(date, 'MMM YYYY');

      expect(getString(parse(full, 'MMMM YYYY'), 'MMMM YYYY')).toBe(full);
      expect(getString(parse(short, 'MMM YYYY'), 'MMM YYYY')).toBe(short);
    }
  });
});

describe('weekday names parse from the same table they render from', () => {
  // 2024-03-17 is a Sunday, so the week that follows covers every weekday.
  it.each([
    ['Sun', 17],
    ['Mon', 18],
    ['Wed', 20],
    ['Sat', 23],
  ])('reads the abbreviation %s for 2024-03-%i', (name, day) => {
    const rendered = `2024-03-${day} ${name}`;
    const parsed = parse(rendered, 'YYYY-MM-DD ddd');

    expect(getString(parsed, 'YYYY-MM-DD ddd')).toBe(rendered);
  });

  it('rejects an abbreviation that disagrees with the date', () => {
    // 2024-03-17 is a Sunday, not a Monday.
    expect(isValid('2024-03-17 Mon', 'YYYY-MM-DD ddd')).toBe(false);
    expect(isValid('2024-03-17 Sun', 'YYYY-MM-DD ddd')).toBe(true);
  });

  it('rejects a run-together abbreviation, which a wrong separator would allow', () => {
    expect(isValid('2024-03-17 SunMon', 'YYYY-MM-DD ddd')).toBe(false);
    expect(isValid('2024-03-17 Su', 'YYYY-MM-DD ddd')).toBe(false);
  });

  it('round-trips every weekday', () => {
    for (let day = 17; day <= 23; day += 1) {
      const rendered = getString(new Date(2024, 2, day), 'YYYY-MM-DD ddd');

      expect(getString(parse(rendered, 'YYYY-MM-DD ddd'), 'YYYY-MM-DD ddd')).toBe(rendered);
    }

    for (let day = 17; day <= 23; day += 1) {
      const rendered = getString(new Date(2024, 2, day), 'YYYY-MM-DD dddd');

      expect(getString(parse(rendered, 'YYYY-MM-DD dddd'), 'YYYY-MM-DD dddd')).toBe(rendered);
    }
  });
});

describe('literal separators are matched literally', () => {
  // A regex-escaping mistake would let '.' match any character.
  it('does not treat a dot as a wildcard', () => {
    expect(isValid('2024.03.17', 'YYYY.MM.DD')).toBe(true);
    expect(isValid('2024x03x17', 'YYYY.MM.DD')).toBe(false);
    expect(isValid('2024-03-17', 'YYYY.MM.DD')).toBe(false);
  });

  it.each(['YYYY+MM+DD', 'YYYY(MM)DD', 'YYYY*MM*DD', 'YYYY$MM$DD', 'YYYY|MM|DD', 'YYYY?MM?DD'])(
    'treats the separators in %s literally',
    (format) => {
      const rendered = getString(new Date(2024, 2, 17), format);

      expect(isValid(rendered, format)).toBe(true);
      expect(isValid(rendered.replace(/[+()*$|?]/g, 'x'), format)).toBe(false);
    },
  );
});

describe('formats made only of escaped text', () => {
  // Nothing tested a format with an escape and no token, so the flag that
  // records "an escape was seen" could be inverted unnoticed.
  it('renders the literal', () => {
    expect(getString(new Date(2024, 2, 17), '[hello]')).toBe('hello');
    expect(getString(new Date(2024, 2, 17), '[2024]')).toBe('2024');
  });

  it('renders an empty escape as nothing', () => {
    expect(getString(new Date(2024, 2, 17), '[]')).toBe('');
  });

  it('still rejects text with no escape and no token', () => {
    // 'hello' would not do: `h` is the 12-hour token, so it renders '2ello'.
    expect(() => getString(new Date(2024, 2, 17), '###')).toThrowError(/no format tokens/);
    expect(getString(new Date(2024, 2, 17, 14, 30), 'hello')).toBe('2ello');
  });
});
