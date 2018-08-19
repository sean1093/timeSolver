const timeSolver = require('./../src/1.2.0/timeSolver');

test('compare equals', () => {
    const date = new Date();
    const copiedDate = new Date(date.getTime());
    const expectResult = timeSolver.equal(date, copiedDate);
    expect(expectResult).toBe(true);
});

test('compare equals after manipulating', () => {
    const date = new Date();
    const copiedDate = new Date(date.getTime());
    const expectResult = timeSolver.equal(date, 
        timeSolver.add(
            timeSolver.subtract(copiedDate, 14, 'month'), 
        14, 'month')
    );
    expect(expectResult).toBe(true);
});

test('2015/11/18 after 2015/12/12 => false', () => {
    const expectResult = timeSolver.after(new Date('2015/11/18'), new Date('2015/12/12'));
    expect(expectResult).toBe(false);
});

test('2015-11-18 after 2014/11/12 => true', () => {
    const expectResult = timeSolver.after(new Date('2015-11-18'), new Date('2014/11/12'));
    expect(expectResult).toBe(true);
});

test('2015-11-18 after 2014.11.12 => true', () => {
    const expectResult = timeSolver.after(new Date('2015-11-18'), new Date('2014.11.12'));
    expect(expectResult).toBe(true);
});

test('2015-01-01 after 2014/12/31 => true', () => {
    const expectResult = timeSolver.after(new Date('2015-01-01'), new Date('2014/12/31'));
    expect(expectResult).toBe(true);
});

test('2015-01-01 before 2014/12/31 => false', () => {
    const expectResult = timeSolver.before(new Date('2015-01-01'), new Date('2014/12/31'));
    expect(expectResult).toBe(false);
});

test('2015/11/18 before 2015/12/12 => true', () => {
    const expectResult = timeSolver.before(new Date('2015/11/18'), new Date('2015/12/12'));
    expect(expectResult).toBe(true);
});

test('2015/11/18 after new Date() => false', () => {
    const expectResult = timeSolver.afterToday(new Date('2015/11/18 '));
    expect(expectResult).toBe(false);
});

test('2015.12.31 after new Date() => false', () => {
    const expectResult = timeSolver.afterToday(new Date(' 2015.12.31 '));
    expect(expectResult).toBe(false);
});

test('2015/11/18 before new Date() => true', () => {
    const expectResult = timeSolver.beforeToday(new Date('2015/11/18 '));
    expect(expectResult).toBe(true);
});

describe('between function test', () => {
    let date;
    beforeEach(() => {
        date = new Date();
    });

    test('between in 1 millisecond', () => {
        const expectResult = timeSolver.between(
            date, 
            new Date(date.getTime() + 1), 
            'mill');
        expect(expectResult).toBe(1);
    });

    test('between in 5 second', () => {
        const expectResult = timeSolver.between(
            date, 
            new Date(date.getTime() + 5000), 
            's');
        expect(expectResult).toBe(5);
    });

    test('between in 5 min', () => {
        const expectResult = timeSolver.between(
            date, 
            new Date(date.getTime() + 5000 * 60), 
            'min');
        expect(expectResult).toBe(5);
    });

    test('between in one day', () => {
        const expectResult = timeSolver.between('2015/11/18', '2015/11/19', 'd');
        expect(expectResult).toBe(1);
    });
});
