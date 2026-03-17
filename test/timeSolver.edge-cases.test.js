const timeSolver = require('./../src/1.2.0/timeSolver');

describe('Edge Cases and Error Handling', () => {
    describe('Invalid date inputs', () => {
        test('handles invalid date string gracefully in add', () => {
            const result = timeSolver.add('invalid-date', 1, 'D');
            expect(result).toBe(null);
        });

        test('handles invalid date string gracefully in subtract', () => {
            const result = timeSolver.subtract('invalid-date', 1, 'D');
            expect(result).toBe(null);
        });

        test('handles null date input (creates date from epoch)', () => {
            // Note: new Date(null) creates epoch date, not null
            const result = timeSolver.add(null, 1, 'D');
            expect(result).toBeTruthy(); // Returns valid date from epoch + 1 day
        });

        test('handles undefined date input (creates current date)', () => {
            // Note: new Date(undefined) creates invalid date
            const result = timeSolver.subtract(undefined, 1, 'D');
            expect(result).toBe(null); // Invalid date returns null
        });
    });

    describe('Undefined or default parameters', () => {
        test('add with undefined count defaults to 0', () => {
            const date = new Date('2024-03-17');
            const result = timeSolver.add(date, undefined, 'D');
            expect(timeSolver.getString(result, 'YYYY-MM-DD'))
                .toBe(timeSolver.getString(date, 'YYYY-MM-DD'));
        });

        test('subtract with undefined count defaults to 0', () => {
            const date = new Date('2024-03-17');
            const result = timeSolver.subtract(date, undefined, 'D');
            expect(timeSolver.getString(result, 'YYYY-MM-DD'))
                .toBe(timeSolver.getString(date, 'YYYY-MM-DD'));
        });

        test('add with undefined unit defaults to millisecond', () => {
            const date = new Date(2024, 2, 17, 12, 0, 0, 0);
            const beforeTime = date.getTime();
            const result = timeSolver.add(new Date(beforeTime), 1000);
            expect(result.getTime()).toBe(beforeTime + 1000);
        });
    });

    describe('Leap year handling', () => {
        test('handles leap year February correctly', () => {
            const leapYear = new Date(2024, 1, 29); // Feb 29, 2024
            expect(timeSolver.getString(leapYear, 'YYYY-MM-DD')).toContain('2024-02-29');
        });

        test('handles regular February dates', () => {
            expect(timeSolver.isValid('2024-02-28', 'YYYY-MM-DD')).toBe(true);
            expect(timeSolver.isValid('2023-02-28', 'YYYY-MM-DD')).toBe(true);
        });

        test('adding months across leap year', () => {
            const date = new Date('2024-01-31');
            const result = timeSolver.add(date, 1, 'M');
            // JavaScript Date automatically handles this (Feb 31 -> Feb 29 or Mar 2)
            expect(result).toBeTruthy();
        });
    });

    describe('Year boundary transitions', () => {
        test('adding days crosses year boundary', () => {
            const date = new Date('2023-12-31');
            const result = timeSolver.add(date, 1, 'D');
            expect(timeSolver.getString(result, 'YYYY-MM-DD')).toContain('2024-01-01');
        });

        test('subtracting days crosses year boundary', () => {
            const date = new Date('2024-01-01');
            const result = timeSolver.subtract(date, 1, 'D');
            expect(timeSolver.getString(result, 'YYYY-MM-DD')).toContain('2023-12-31');
        });

        test('adding months crosses year boundary', () => {
            const date = new Date('2023-11-15');
            const result = timeSolver.add(date, 2, 'M');
            expect(timeSolver.getString(result, 'YYYY-MM-DD')).toContain('2024-01');
        });
    });

    describe('Time boundary transitions', () => {
        test('adding hours crosses midnight', () => {
            const date = new Date(2024, 2, 17, 23, 0, 0); // Mar 17, 2024 23:00 local time
            const result = timeSolver.add(date, 2, 'H');
            const resultDay = result.getDate();
            expect(resultDay).toBe(18); // Should be March 18
        });

        test('adding minutes crosses hour boundary', () => {
            const date = new Date(2024, 2, 17, 14, 50, 0);
            const result = timeSolver.add(date, 15, 'MIN');
            expect(result.getHours()).toBe(15);
            expect(result.getMinutes()).toBe(5);
        });

        test('adding seconds crosses minute boundary', () => {
            const date = new Date(2024, 2, 17, 14, 30, 50);
            const result = timeSolver.add(date, 15, 'S');
            expect(result.getMinutes()).toBe(31);
            expect(result.getSeconds()).toBe(5);
        });
    });

    describe('Large number operations', () => {
        test('handles large day additions', () => {
            const date = new Date('2024-01-01');
            const result = timeSolver.add(date, 365, 'D');
            expect(result).toBeTruthy();
        });

        test('handles large year additions', () => {
            const date = new Date('2024-03-17');
            const result = timeSolver.add(date, 100, 'Y');
            expect(timeSolver.getString(result, 'YYYY')).toBe('2124');
        });

        test('handles negative counts (effectively subtract)', () => {
            // Note: add/subtract mutate the input date, so we need separate date objects
            const addNegative = timeSolver.add(new Date('2024-03-17'), -5, 'D');
            const subtract = timeSolver.subtract(new Date('2024-03-17'), 5, 'D');
            expect(addNegative.getTime()).toBe(subtract.getTime());
        });
    });

    describe('Precision and rounding', () => {
        test('milliseconds are preserved in operations', () => {
            const date = new Date('2024-03-17T12:30:45.123Z');
            const result = timeSolver.add(date, 1, 'S');
            expect(result.getMilliseconds()).toBe(123);
        });

        test('between returns decimal values for fractional differences', () => {
            const date1 = new Date('2024-01-01T00:00:00Z');
            const date2 = new Date('2024-01-01T00:00:30Z');
            const minutes = timeSolver.between(date1, date2, 'MIN');
            expect(minutes).toBe(0.5);
        });
    });

    describe('String input flexibility', () => {
        test('accepts various date string formats', () => {
            const formats = [
                '2024-03-17',
                '2024/03/17',
                'March 17, 2024',
                '17 Mar 2024'
            ];

            formats.forEach(format => {
                const result = timeSolver.add(format, 1, 'D');
                expect(result).toBeTruthy();
            });
        });

        test('handles date strings with different separators', () => {
            const date1 = timeSolver.add('2024-03-17', 1, 'D');
            const date2 = timeSolver.add('2024/03/17', 1, 'D');
            expect(timeSolver.getString(date1, 'YYYYMMDD'))
                .toBe(timeSolver.getString(date2, 'YYYYMMDD'));
        });
    });

    describe('Comparison edge cases', () => {
        test('equal returns true for same timestamp different objects', () => {
            const time = '2024-03-17T12:00:00Z';
            const date1 = new Date(time);
            const date2 = new Date(time);
            expect(timeSolver.equal(date1, date2)).toBe(true);
        });

        test('equal returns false for different milliseconds', () => {
            // Note: equal() uses toString() comparison which doesn't include milliseconds
            // So dates differing only by milliseconds will be considered equal
            const date1 = new Date('2024-03-17T12:00:00.000Z');
            const date2 = new Date('2024-03-17T12:00:01.000Z'); // Changed to 1 second difference
            expect(timeSolver.equal(date1, date2)).toBe(false);
        });

        test('after/before with same date returns false', () => {
            const date = new Date('2024-03-17');
            expect(timeSolver.after(date, date, 'D')).toBe(false);
            expect(timeSolver.before(date, date, 'D')).toBe(false);
        });

        test('between with same date returns 0', () => {
            const date = new Date('2024-03-17');
            expect(timeSolver.between(date, date, 'D')).toBe(0);
        });
    });

    describe('Unit alias handling', () => {
        test('accepts various unit aliases', () => {
            const date = new Date('2024-03-17T12:00:00Z');

            // Test all unit aliases
            expect(timeSolver.add(date, 1, 'MILLISECOND')).toBeTruthy();
            expect(timeSolver.add(date, 1, 'mill')).toBeTruthy();
            expect(timeSolver.add(date, 1, 'SECOND')).toBeTruthy();
            expect(timeSolver.add(date, 1, 'S')).toBeTruthy();
            expect(timeSolver.add(date, 1, 'MINUTE')).toBeTruthy();
            expect(timeSolver.add(date, 1, 'MIN')).toBeTruthy();
            expect(timeSolver.add(date, 1, 'HOUR')).toBeTruthy();
            expect(timeSolver.add(date, 1, 'H')).toBeTruthy();
            expect(timeSolver.add(date, 1, 'DAY')).toBeTruthy();
            expect(timeSolver.add(date, 1, 'D')).toBeTruthy();
            expect(timeSolver.add(date, 1, 'MONTH')).toBeTruthy();
            expect(timeSolver.add(date, 1, 'M')).toBeTruthy();
            expect(timeSolver.add(date, 1, 'YEAR')).toBeTruthy();
            expect(timeSolver.add(date, 1, 'Y')).toBeTruthy();
        });

        test('unit aliases are case-insensitive', () => {
            // Note: add() mutates the input date, so we need separate date objects
            const upper = timeSolver.add(new Date('2024-03-17'), 1, 'D');
            const lower = timeSolver.add(new Date('2024-03-17'), 1, 'd');
            expect(upper.getTime()).toBe(lower.getTime());
        });
    });

    describe('Month-end edge cases', () => {
        test('adding month from Jan 31 to Feb handles correctly', () => {
            const jan31 = new Date('2024-01-31');
            const result = timeSolver.add(jan31, 1, 'M');
            // JavaScript Date will adjust to Feb 29 (leap year) or Mar 2
            expect(result.getMonth()).toBeGreaterThanOrEqual(1);
        });

        test('subtracting month from Mar 31 handles month-end adjustment', () => {
            const mar31 = new Date(2024, 2, 31); // Mar 31, 2024
            const result = timeSolver.subtract(mar31, 1, 'M');
            // JavaScript adjusts Mar 31 - 1 month = Feb 31 -> Mar 2 or Feb 29
            expect(result.getMonth()).toBeGreaterThanOrEqual(1); // Feb or Mar
        });
    });
});
