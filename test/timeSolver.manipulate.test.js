const timeSolver = require('./../src/1.2.0/timeSolver');

describe('add function', () => {
    let date;
    beforeEach(() => {
        date = new Date();
    });
      
    test('add 300 millisecond', () => {   
        const copiedDate = new Date(date.getTime());
        const expectResult = timeSolver.add(date, 300, 'mill').getTime();
        const toBeResult = copiedDate.getTime() + 300;
        expect(expectResult).toBe(toBeResult);
    });

    test('add 300 second', () => {     
        const copiedDate = new Date(date.getTime());
        const expectResult = timeSolver.add(date, 300, 's').getTime();
        const toBeResult = copiedDate.getTime() + 1000 * 300;
        expect(expectResult).toBe(toBeResult);
    });

    test('add 10 minutes', () => {      
        const copiedDate = new Date(date.getTime());
        const expectResult = timeSolver.add(date, 10, 'min').getTime();
        const toBeResult = copiedDate.getTime() + 1000 * 60 * 10;
        expect(expectResult).toBe(toBeResult);
    });

    test('add 5 hours', () => {       
        const copiedDate = new Date(date.getTime());
        const expectResult = timeSolver.add(date, 5, 'h').getTime();
        const toBeResult = copiedDate.getTime() + 1000 * 60 * 60 * 5;
        expect(expectResult).toBe(toBeResult);
    });

    test('add 5 days', () => {       
        const copiedDate = new Date(date.getTime());
        const expectResult = timeSolver.add(date, 5, 'd').getTime();
        const toBeResult = copiedDate.getTime() + 1000 * 60 * 60 *24 * 5;
        expect(expectResult).toBe(toBeResult);
    });

    test('add 2 months', () => {
        const expectResult = timeSolver.add('2018/02/01', 2, 'm').getTime();
        const toBeResult = new Date('2018/04/01').getTime() ;
        expect(timeSolver.getString(expectResult,'YYYYMMDD'))
            .toBe(timeSolver.getString(toBeResult,'YYYYMMDD'));
    });

    test('add 2 years', () => {
        const expectResult = timeSolver.add('2018/02/01', 1, 'y').getTime();
        const toBeResult = new Date('2019/02/01').getTime() ;
        expect(timeSolver.getString(expectResult,'YYYYMMDD'))
            .toBe(timeSolver.getString(toBeResult,'YYYYMMDD'));
    });

    test('add date but not give any value', () => {
        const expectResult = timeSolver.add('2018/02/01');
        expect(expectResult)
            .toBe(null);
    });
});

describe('subtract function', () => {
    let date;
    beforeEach(() => {
        date = new Date();
    });

    test('subtract 300 millisecond', () => {
        const copiedDate = new Date(date.getTime());
        const expectResult = timeSolver.subtract(date, 300, 'mill').getTime();
        const toBeResult = copiedDate.getTime() - 300;
        expect(expectResult).toBe(toBeResult);
    });

    test('subtract 300 second', () => {      
        const copiedDate = new Date(date.getTime());
        const expectResult = timeSolver.subtract(date, 300, 's').getTime();
        const toBeResult = copiedDate.getTime() - 1000 * 300;
        expect(expectResult).toBe(toBeResult);
    });

    test('subtract 10 minutes', () => {       
        const copiedDate = new Date(date.getTime());
        const expectResult = timeSolver.subtract(date, 10, 'min').getTime();
        const toBeResult = copiedDate.getTime() - 1000 * 60 * 10;
        expect(expectResult).toBe(toBeResult);
    });

    test('subtract 5 hours', () => {     
        const copiedDate = new Date(date.getTime());
        const expectResult = timeSolver.subtract(date, 5, 'h').getTime();
        const toBeResult = copiedDate.getTime() - 1000 * 60 * 60 * 5;
        expect(expectResult).toBe(toBeResult);
    });

    test('subtract 5 days', () => {    
        const copiedDate = new Date(date.getTime());
        const expectResult = timeSolver.subtract(date, 5, 'd').getTime();
        const toBeResult = copiedDate.getTime() - 1000 * 60 * 60 *24 * 5;
        expect(expectResult).toBe(toBeResult);
    });

    test('subtract 2 months', () => {
        const expectResult = timeSolver.subtract('2018/04/01', 2, 'm').getTime();
        const toBeResult = new Date('2018/02/01').getTime() ;
        expect(timeSolver.getString(expectResult,'YYYYMMDD'))
            .toBe(timeSolver.getString(toBeResult,'YYYYMMDD'));
    });

    test('subtract 2 years', () => {
        const expectResult = timeSolver.subtract('2018/04/01', 1, 'y').getTime();
        const toBeResult = new Date('2017/04/01').getTime() ;
        expect(timeSolver.getString(expectResult,'YYYYMMDD'))
            .toBe(timeSolver.getString(toBeResult,'YYYYMMDD'));
    });

    test('subtract date but not give any value', () => {
        const expectResult = timeSolver.subtract('2018/02/01');
        expect(expectResult)
            .toBe(null);
    });
});
