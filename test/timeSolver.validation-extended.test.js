const timeSolver = require('./../src/1.2.0/timeSolver');

describe('isValid - Extended Validation Tests', () => {
    describe('DD/MM/YYYY format validation', () => {
        test('validates correct DD/MM/YYYY dates', () => {
            expect(timeSolver.isValid('17/03/2024', 'DD/MM/YYYY')).toBe(true);
            expect(timeSolver.isValid('01/01/2024', 'DD/MM/YYYY')).toBe(true);
            expect(timeSolver.isValid('31/12/2024', 'DD/MM/YYYY')).toBe(true);
        });

        test('validates correct DD-MM-YYYY dates', () => {
            expect(timeSolver.isValid('17-03-2024', 'DD-MM-YYYY')).toBe(true);
            expect(timeSolver.isValid('28-02-2024', 'DD-MM-YYYY')).toBe(true);
        });

        test('validates correct DD.MM.YYYY dates', () => {
            expect(timeSolver.isValid('17.03.2024', 'DD.MM.YYYY')).toBe(true);
            expect(timeSolver.isValid('15.06.2024', 'DD.MM.YYYY')).toBe(true);
        });

        test('rejects invalid DD/MM/YYYY dates', () => {
            expect(timeSolver.isValid('32/01/2024', 'DD/MM/YYYY')).toBe(false);
            expect(timeSolver.isValid('00/01/2024', 'DD/MM/YYYY')).toBe(false);
            expect(timeSolver.isValid('15/13/2024', 'DD/MM/YYYY')).toBe(false);
            expect(timeSolver.isValid('15/00/2024', 'DD/MM/YYYY')).toBe(false);
        });

        test('rejects wrong separator for DD/MM/YYYY', () => {
            expect(timeSolver.isValid('17-03-2024', 'DD/MM/YYYY')).toBe(false);
            expect(timeSolver.isValid('17.03.2024', 'DD/MM/YYYY')).toBe(false);
        });
    });

    describe('DD/MM/YYYY with time validation', () => {
        test('validates DD/MM/YYYY HH:MM:SS format', () => {
            expect(timeSolver.isValid('17/03/2024 14:30:45', 'DD/MM/YYYY HH:MM:SS')).toBe(true);
            expect(timeSolver.isValid('01/01/2024 00:00:00', 'DD/MM/YYYY HH:MM:SS')).toBe(true);
            expect(timeSolver.isValid('31/12/2024 23:59:59', 'DD/MM/YYYY HH:MM:SS')).toBe(true);
        });

        test('validates DD-MM-YYYY HH:MM:SS format', () => {
            expect(timeSolver.isValid('17-03-2024 14:30:45', 'DD-MM-YYYY HH:MM:SS')).toBe(true);
        });

        test('validates DD.MM.YYYY HH:MM:SS format', () => {
            expect(timeSolver.isValid('17.03.2024 14:30:45', 'DD.MM.YYYY HH:MM:SS')).toBe(true);
        });

        test('rejects invalid time in DD/MM/YYYY HH:MM:SS', () => {
            expect(timeSolver.isValid('17/03/2024 25:00:00', 'DD/MM/YYYY HH:MM:SS')).toBe(false);
            expect(timeSolver.isValid('17/03/2024 14:60:00', 'DD/MM/YYYY HH:MM:SS')).toBe(false);
            expect(timeSolver.isValid('17/03/2024 14:30:60', 'DD/MM/YYYY HH:MM:SS')).toBe(false);
        });

        test('rejects invalid date in DD/MM/YYYY HH:MM:SS', () => {
            expect(timeSolver.isValid('32/01/2024 12:00:00', 'DD/MM/YYYY HH:MM:SS')).toBe(false);
            expect(timeSolver.isValid('17/13/2024 12:00:00', 'DD/MM/YYYY HH:MM:SS')).toBe(false);
        });
    });

    describe('YYYY/MM/DD format validation', () => {
        test('validates correct YYYY/MM/DD dates', () => {
            expect(timeSolver.isValid('2024/03/17', 'YYYY/MM/DD')).toBe(true);
            expect(timeSolver.isValid('2024/01/01', 'YYYY/MM/DD')).toBe(true);
            expect(timeSolver.isValid('2024/12/31', 'YYYY/MM/DD')).toBe(true);
        });

        test('validates correct YYYY-MM-DD dates', () => {
            expect(timeSolver.isValid('2024-03-17', 'YYYY-MM-DD')).toBe(true);
            expect(timeSolver.isValid('2024-02-28', 'YYYY-MM-DD')).toBe(true);
        });

        test('validates correct YYYY.MM.DD dates', () => {
            expect(timeSolver.isValid('2024.03.17', 'YYYY.MM.DD')).toBe(true);
        });

        test('rejects invalid YYYY/MM/DD dates', () => {
            expect(timeSolver.isValid('2024/13/01', 'YYYY/MM/DD')).toBe(false);
            expect(timeSolver.isValid('2024/01/32', 'YYYY/MM/DD')).toBe(false);
            expect(timeSolver.isValid('2024/00/15', 'YYYY/MM/DD')).toBe(false);
        });
    });

    describe('Edge cases and month-specific validation', () => {
        test('validates months with 31 days', () => {
            // Jan, Mar, May, Jul, Aug, Oct, Dec have 31 days
            expect(timeSolver.isValid('2024/01/31', 'YYYY/MM/DD')).toBe(true);
            expect(timeSolver.isValid('2024/03/31', 'YYYY/MM/DD')).toBe(true);
            expect(timeSolver.isValid('2024/12/31', 'YYYY/MM/DD')).toBe(true);
        });

        test('rejects day 31 for months with 30 days', () => {
            // Apr, Jun, Sep, Nov have 30 days
            expect(timeSolver.isValid('2024/04/31', 'YYYY/MM/DD')).toBe(false);
            expect(timeSolver.isValid('2024/06/31', 'YYYY/MM/DD')).toBe(false);
            expect(timeSolver.isValid('2024/09/31', 'YYYY/MM/DD')).toBe(false);
            expect(timeSolver.isValid('2024/11/31', 'YYYY/MM/DD')).toBe(false);
        });

        test('validates day 30 for 30-day months', () => {
            expect(timeSolver.isValid('2024/04/30', 'YYYY/MM/DD')).toBe(true);
            expect(timeSolver.isValid('2024/06/30', 'YYYY/MM/DD')).toBe(true);
        });

        test('rejects February dates beyond 28', () => {
            expect(timeSolver.isValid('2024/02/28', 'YYYY/MM/DD')).toBe(true);
            expect(timeSolver.isValid('2023/02/28', 'YYYY/MM/DD')).toBe(true);
            // Note: regex validation doesn't check for leap year, only day ranges
            expect(timeSolver.isValid('2024/02/30', 'YYYY/MM/DD')).toBe(false);
        });
    });

    describe('Time-only format validation', () => {
        test('validates HH:MM:SS in context', () => {
            // Note: HH:MM:SS requires a space-separated format
            expect(timeSolver.isValid('2024/01/01 12:30:45', 'YYYY/MM/DD HH:MM:SS')).toBe(true);
        });

        test('validates valid time ranges', () => {
            expect(timeSolver.isValid('2024/01/01 00:00:00', 'YYYY/MM/DD HH:MM:SS')).toBe(true);
            expect(timeSolver.isValid('2024/01/01 23:59:59', 'YYYY/MM/DD HH:MM:SS')).toBe(true);
        });

        test('rejects invalid hours', () => {
            expect(timeSolver.isValid('2024/01/01 24:00:00', 'YYYY/MM/DD HH:MM:SS')).toBe(false);
            expect(timeSolver.isValid('2024/01/01 25:30:00', 'YYYY/MM/DD HH:MM:SS')).toBe(false);
        });

        test('rejects invalid minutes', () => {
            expect(timeSolver.isValid('2024/01/01 12:60:00', 'YYYY/MM/DD HH:MM:SS')).toBe(false);
        });

        test('rejects invalid seconds', () => {
            expect(timeSolver.isValid('2024/01/01 12:30:60', 'YYYY/MM/DD HH:MM:SS')).toBe(false);
        });
    });

    describe('Format without format parameter', () => {
        test('validates dates using native Date parsing', () => {
            expect(timeSolver.isValid('2024-03-17')).toBe(true);
            expect(timeSolver.isValid('2024/03/17')).toBe(true);
            expect(timeSolver.isValid('March 17, 2024')).toBe(true);
        });

        test('rejects invalid dates', () => {
            expect(timeSolver.isValid('invalid-date')).toBe(false);
            expect(timeSolver.isValid('2024-13-01')).toBe(false);
            expect(timeSolver.isValid('')).toBe(false);
        });
    });

    describe('Case insensitivity', () => {
        test('accepts lowercase format strings', () => {
            expect(timeSolver.isValid('2024/03/17', 'yyyy/mm/dd')).toBe(true);
            expect(timeSolver.isValid('17/03/2024', 'dd/mm/yyyy')).toBe(true);
        });

        test('accepts mixed case format strings', () => {
            expect(timeSolver.isValid('2024-03-17', 'YyYy-Mm-Dd')).toBe(true);
        });
    });

    describe('Error handling', () => {
        test('returns null for invalid format string', () => {
            expect(timeSolver.isValid('2024-03-17', 'INVALID_FORMAT')).toBe(null);
        });
    });
});
