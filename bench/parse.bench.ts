/**
 * Reading a string against an explicit format, and deciding whether a string
 * is a real date in that format.
 *
 * Only timeSolver does both out of the box. dayjs needs its
 * `customParseFormat` plugin, registered in `fixtures.ts`; needing the plugin
 * at all is part of the comparison, and its weight is in the bundle rather
 * than in these numbers. date-fns has no format-aware validator, so the
 * idiomatic equivalent is `isValid(parse(...))`, which is what is timed.
 *
 * Both benchmarks use a string that parses. Rejection paths are cheaper in
 * every library — they exit early — so timing a failure would flatter whoever
 * gives up soonest.
 */

import { isValid as fnsIsValid, parse as fnsParse } from 'date-fns';
import { bench, describe } from 'vitest';
import { isValid, parse } from '../src/index.js';
import {
  BUDGET,
  DATE_TEXT,
  DAYJS_PARSE_FORMAT,
  dayjs,
  FNS_PARSE_FORMAT,
  FNS_REFERENCE,
  sink,
  TS_PARSE_FORMAT,
} from './fixtures.js';

describe("parse '17/03/2024' with an explicit format", () => {
  bench(
    'timesolver parse',
    () => {
      sink.value = parse(DATE_TEXT, TS_PARSE_FORMAT);
    },
    BUDGET,
  );

  bench(
    'dayjs with customParseFormat, strict',
    () => {
      sink.value = dayjs(DATE_TEXT, DAYJS_PARSE_FORMAT, true);
    },
    BUDGET,
  );

  bench(
    'date-fns parse',
    () => {
      sink.value = fnsParse(DATE_TEXT, FNS_PARSE_FORMAT, FNS_REFERENCE);
    },
    BUDGET,
  );
});

describe('validate a string against a format', () => {
  bench(
    'timesolver isValid',
    () => {
      sink.value = isValid(DATE_TEXT, TS_PARSE_FORMAT);
    },
    BUDGET,
  );

  bench(
    'dayjs strict isValid',
    () => {
      sink.value = dayjs(DATE_TEXT, DAYJS_PARSE_FORMAT, true).isValid();
    },
    BUDGET,
  );

  bench(
    'date-fns isValid of parse',
    () => {
      sink.value = fnsIsValid(fnsParse(DATE_TEXT, FNS_PARSE_FORMAT, FNS_REFERENCE));
    },
    BUDGET,
  );
});
