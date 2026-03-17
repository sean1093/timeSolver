const timeSolver = require('./../src/1.2.0/timeSolver');

describe('Helper Functions - Week and Month', () => {
    describe('getAbbrWeek', () => {
        test('returns abbreviated weekday name', () => {
            const monday = new Date('2024-03-18T00:00:00Z'); // Monday
            const result = timeSolver.getAbbrWeek(monday);
            expect(result).toBe('Mon');
        });

        test('returns abbreviated weekday for Sunday', () => {
            const sunday = new Date('2024-03-17T00:00:00Z'); // Sunday
            const result = timeSolver.getAbbrWeek(sunday);
            expect(result).toBe('Sun');
        });

        test('handles string date input', () => {
            const result = timeSolver.getAbbrWeek('2024-03-20');
            expect(result).toBe('Wed');
        });
    });

    describe('getFullWeek', () => {
        test('returns full weekday name', () => {
            const monday = new Date('2024-03-18T00:00:00Z');
            expect(timeSolver.getFullWeek(monday)).toBe('Monday');
        });

        test('returns full weekday for all days', () => {
            const weekdays = [
                { date: '2024-03-17', expected: 'Sunday' },
                { date: '2024-03-18', expected: 'Monday' },
                { date: '2024-03-19', expected: 'Tuesday' },
                { date: '2024-03-20', expected: 'Wednesday' },
                { date: '2024-03-21', expected: 'Thursday' },
                { date: '2024-03-22', expected: 'Friday' },
                { date: '2024-03-23', expected: 'Saturday' }
            ];

            weekdays.forEach(({ date, expected }) => {
                expect(timeSolver.getFullWeek(new Date(date))).toBe(expected);
            });
        });
    });

    describe('getAbbrMonth', () => {
        test('returns abbreviated month name', () => {
            const date = new Date('2024-03-17T00:00:00Z');
            const result = timeSolver.getAbbrMonth(date);
            expect(result).toHaveLength(3);
            expect(result).toBe('Mar');
        });

        test('handles all months', () => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            months.forEach((abbr, index) => {
                const date = new Date(2024, index, 15);
                expect(timeSolver.getAbbrMonth(date)).toBe(abbr);
            });
        });
    });

    describe('getFullMonth', () => {
        test('returns full month name', () => {
            const date = new Date('2024-03-17T00:00:00Z');
            expect(timeSolver.getFullMonth(date)).toBe('March');
        });

        test('handles all months', () => {
            const months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];

            months.forEach((name, index) => {
                const date = new Date(2024, index, 15);
                expect(timeSolver.getFullMonth(date)).toBe(name);
            });
        });
    });

    describe('getQuarterByMonth', () => {
        test('returns Q1 for months 1-3', () => {
            expect(timeSolver.getQuarterByMonth(1)).toBe(1);
            expect(timeSolver.getQuarterByMonth(2)).toBe(1);
            expect(timeSolver.getQuarterByMonth(3)).toBe(1);
        });

        test('returns Q2 for months 4-6', () => {
            expect(timeSolver.getQuarterByMonth(4)).toBe(2);
            expect(timeSolver.getQuarterByMonth(5)).toBe(2);
            expect(timeSolver.getQuarterByMonth(6)).toBe(2);
        });

        test('returns Q3 for months 7-9', () => {
            expect(timeSolver.getQuarterByMonth(7)).toBe(3);
            expect(timeSolver.getQuarterByMonth(8)).toBe(3);
            expect(timeSolver.getQuarterByMonth(9)).toBe(3);
        });

        test('returns Q4 for months 10-12', () => {
            expect(timeSolver.getQuarterByMonth(10)).toBe(4);
            expect(timeSolver.getQuarterByMonth(11)).toBe(4);
            expect(timeSolver.getQuarterByMonth(12)).toBe(4);
        });

        test('returns null for invalid month', () => {
            expect(timeSolver.getQuarterByMonth(0)).toBe(null);
            expect(timeSolver.getQuarterByMonth(13)).toBe(null);
            expect(timeSolver.getQuarterByMonth(-1)).toBe(null);
        });
    });

    describe('getFirstMonthByQuarter', () => {
        test('returns first month for each quarter', () => {
            expect(timeSolver.getFirstMonthByQuarter(1)).toBe(1);
            expect(timeSolver.getFirstMonthByQuarter(2)).toBe(4);
            expect(timeSolver.getFirstMonthByQuarter(3)).toBe(7);
            expect(timeSolver.getFirstMonthByQuarter(4)).toBe(10);
        });

        test('returns null for invalid quarter', () => {
            expect(timeSolver.getFirstMonthByQuarter(0)).toBe(null);
            expect(timeSolver.getFirstMonthByQuarter(5)).toBe(null);
            expect(timeSolver.getFirstMonthByQuarter(-1)).toBe(null);
        });
    });
});

describe('Between - Time Calculation', () => {
    describe('between with different units', () => {
        const date1 = new Date('2024-01-01T00:00:00Z');
        const date2 = new Date('2024-01-01T01:30:00Z'); // 1.5 hours later

        test('calculates milliseconds between dates', () => {
            const result = timeSolver.between(date1, date2, 'MILLISECOND');
            expect(result).toBe(5400000); // 1.5 hours in ms
        });

        test('calculates seconds between dates', () => {
            const result = timeSolver.between(date1, date2, 'S');
            expect(result).toBe(5400); // 1.5 hours in seconds
        });

        test('calculates minutes between dates', () => {
            const result = timeSolver.between(date1, date2, 'MIN');
            expect(result).toBe(90); // 1.5 hours in minutes
        });

        test('calculates hours between dates', () => {
            const result = timeSolver.between(date1, date2, 'H');
            expect(result).toBe(1.5);
        });

        test('calculates days between dates', () => {
            const d1 = new Date('2024-01-01');
            const d2 = new Date('2024-01-04');
            const result = timeSolver.between(d1, d2, 'D');
            expect(result).toBeGreaterThan(2.9);
            expect(result).toBeLessThan(3.1);
        });
    });

    describe('between with negative differences', () => {
        test('returns negative when date2 is before date1', () => {
            const date1 = new Date('2024-01-02');
            const date2 = new Date('2024-01-01');
            const result = timeSolver.between(date1, date2, 'D');
            expect(result).toBeLessThan(0);
        });
    });
});
