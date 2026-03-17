const timeSolver = require('./../src/1.2.0/timeSolver');

describe('getString - Date Formatting', () => {
    const testDate = new Date('2024-03-17T14:30:45.123Z');

    describe('Basic date formats', () => {
        test('YYYY format', () => {
            expect(timeSolver.getString(testDate, 'YYYY')).toBe('2024');
        });

        test('YYYYMM format', () => {
            expect(timeSolver.getString(testDate, 'YYYYMM')).toBe('202403');
        });

        test('YYYYMMDD format (default)', () => {
            expect(timeSolver.getString(testDate, 'YYYYMMDD')).toBe('20240317');
        });

        test('default format when no format specified', () => {
            expect(timeSolver.getString(testDate)).toBe('20240317');
        });
    });

    describe('YYYY-first formats with separators', () => {
        test('YYYY/MM/DD format', () => {
            expect(timeSolver.getString(testDate, 'YYYY/MM/DD')).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
        });

        test('YYYY-MM-DD format', () => {
            expect(timeSolver.getString(testDate, 'YYYY-MM-DD')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        test('YYYY.MM.DD format', () => {
            expect(timeSolver.getString(testDate, 'YYYY.MM.DD')).toMatch(/^\d{4}\.\d{2}\.\d{2}$/);
        });
    });

    describe('MM/DD/YYYY formats', () => {
        test('MMDDYYYY format', () => {
            expect(timeSolver.getString(testDate, 'MMDDYYYY')).toMatch(/^\d{8}$/);
        });

        test('MM/DD/YYYY format', () => {
            expect(timeSolver.getString(testDate, 'MM/DD/YYYY')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
        });

        test('MM-DD-YYYY format', () => {
            expect(timeSolver.getString(testDate, 'MM-DD-YYYY')).toMatch(/^\d{2}-\d{2}-\d{4}$/);
        });

        test('MM.DD.YYYY format', () => {
            expect(timeSolver.getString(testDate, 'MM.DD.YYYY')).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
        });
    });

    describe('DD/MM/YYYY formats', () => {
        test('DDMMYYYY format', () => {
            expect(timeSolver.getString(testDate, 'DDMMYYYY')).toMatch(/^\d{8}$/);
        });

        test('DD/MM/YYYY format', () => {
            const result = timeSolver.getString(testDate, 'DD/MM/YYYY');
            expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
        });

        test('DD-MM-YYYY format', () => {
            const result = timeSolver.getString(testDate, 'DD-MM-YYYY');
            expect(result).toMatch(/^\d{2}-\d{2}-\d{4}$/);
        });

        test('DD.MM.YYYY format', () => {
            const result = timeSolver.getString(testDate, 'DD.MM.YYYY');
            expect(result).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
        });
    });

    describe('Date with time formats', () => {
        test('YYYY/MM/DD HH:MM:SS format', () => {
            expect(timeSolver.getString(testDate, 'YYYY/MM/DD HH:MM:SS'))
                .toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/);
        });

        test('YYYY/MM/DD HH:MM:SS.SSS format', () => {
            expect(timeSolver.getString(testDate, 'YYYY/MM/DD HH:MM:SS.SSS'))
                .toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/);
        });

        test('YYYY-MM-DD HH:MM:SS format', () => {
            expect(timeSolver.getString(testDate, 'YYYY-MM-DD HH:MM:SS'))
                .toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
        });

        test('DD/MM/YYYY HH:MM:SS format', () => {
            expect(timeSolver.getString(testDate, 'DD/MM/YYYY HH:MM:SS'))
                .toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/);
        });

        test('DD-MM-YYYY HH:MM:SS.SSS format', () => {
            expect(timeSolver.getString(testDate, 'DD-MM-YYYY HH:MM:SS.SSS'))
                .toMatch(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}\.\d{3}$/);
        });

        test('DD.MM.YYYY HH:MM:SS format', () => {
            expect(timeSolver.getString(testDate, 'DD.MM.YYYY HH:MM:SS'))
                .toMatch(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}$/);
        });
    });

    describe('Time-only formats', () => {
        test('HH:MM:SS format', () => {
            expect(timeSolver.getString(testDate, 'HH:MM:SS'))
                .toMatch(/^\d{2}:\d{2}:\d{2}$/);
        });

        test('HH:MM:SS.SSS format', () => {
            expect(timeSolver.getString(testDate, 'HH:MM:SS.SSS'))
                .toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
        });
    });

    describe('Error handling', () => {
        test('invalid format returns error message', () => {
            expect(timeSolver.getString(testDate, 'INVALID_FORMAT'))
                .toContain('[timeSolver]');
        });

        test('case insensitive format', () => {
            expect(timeSolver.getString(testDate, 'yyyy-mm-dd'))
                .toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('Edge cases', () => {
        test('single digit day and month are zero-padded', () => {
            const date = new Date('2024-01-05T10:05:03.007Z');
            expect(timeSolver.getString(date, 'YYYY-MM-DD')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(timeSolver.getString(date, 'DD/MM/YYYY')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
        });

        test('leap year February 29th', () => {
            const date = new Date('2024-02-29T12:00:00Z');
            expect(timeSolver.getString(date, 'YYYY-MM-DD')).toContain('2024-02-29');
        });

        test('year end December 31st', () => {
            const date = new Date(2023, 11, 31, 23, 59, 59); // Local time
            const result = timeSolver.getString(date, 'YYYY-MM-DD');
            expect(result).toContain('2023-12-31');
        });
    });
});
