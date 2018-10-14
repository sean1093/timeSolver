const timeSolver = require('../timeSolver');


describe('add function', () => {
    let date;
    beforeEach(() => {
        date = new Date('2018/01/01');
    });
    test('Date get format string YYYYMMDD', () => {
        expect('20180101').toBe(timeSolver.getString(date, 'YYYYMMDD'));
    });

    test('Date get format string YYYY/MM/DD', () => {
        expect('2018/01/01').toBe(timeSolver.getString(date, 'YYYY/MM/DD'));
    });

    test('Date get format string YYYY.MM.DD', () => {
        expect('2018.01.01').toBe(timeSolver.getString(date, 'YYYY.MM.DD'));
    });

});