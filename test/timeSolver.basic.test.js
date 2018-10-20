const timeSolver = require('../timeSolver');


describe('get string format function', () => {
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

describe('add function', () => {
    let date;
    beforeEach(() => {
        date = new Date();
    });
      
    // test('add 300 millisecond', () => {   
    //     const copiedDate = new Date(date.getTime());
    //     const expectResult = timeSolver.add(date, 300, 'milli').getTime();
    //     const toBeResult = copiedDate.getTime() + 300;
    //     expect(expectResult).toBe(toBeResult);
    // });

    // test('add 300 second', () => {     
    //     const copiedDate = new Date(date.getTime());
    //     const expectResult = timeSolver.add(date, 300, 's').getTime();
    //     const toBeResult = copiedDate.getTime() + 1000 * 300;
    //     expect(expectResult).toBe(toBeResult);
    // });

    // test('add 10 minutes', () => {      
    //     const copiedDate = new Date(date.getTime());
    //     const expectResult = timeSolver.add(date, 10, 'min').getTime();
    //     const toBeResult = copiedDate.getTime() + 1000 * 60 * 10;
    //     expect(expectResult).toBe(toBeResult);
    // });

    // test('add 5 hours', () => {       
    //     const copiedDate = new Date(date.getTime());
    //     const expectResult = timeSolver.add(date, 5, 'h').getTime();
    //     const toBeResult = copiedDate.getTime() + 1000 * 60 * 60 * 5;
    //     expect(expectResult).toBe(toBeResult);
    // });

    // test('add 5 days', () => {       
    //     const copiedDate = new Date(date.getTime());
    //     const expectResult = timeSolver.add(date, 5, 'd').getTime();
    //     const toBeResult = copiedDate.getTime() + 1000 * 60 * 60 *24 * 5;
    //     expect(expectResult).toBe(toBeResult);
    // });

    test('add 2 months', () => {
        const expectResult = timeSolver.add('2018/02/01', 2, 'm').getTime();
        const toBeResult = new Date('2018/04/01').getTime() ;
        expect(timeSolver.getString(expectResult,'YYYYMMDD'))
            .toBe(timeSolver.getString(toBeResult,'YYYYMMDD'));
    });

    // test('add 2 years', () => {
    //     const expectResult = timeSolver.add('2018/02/01', 1, 'y').getTime();
    //     const toBeResult = new Date('2019/02/01').getTime() ;
    //     expect(timeSolver.getString(expectResult,'YYYYMMDD'))
    //         .toBe(timeSolver.getString(toBeResult,'YYYYMMDD'));
    // });

    // test('add date but not give any value', () => {
    //     const expectResult = timeSolver.add('2018/02/01');
    //     expect(expectResult)
    //         .toBe(null);
    // });
});