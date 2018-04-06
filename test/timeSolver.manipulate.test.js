const timeSolver = require('./../timeSolver');

test('add 300 second', () => {
    const expectResult = timeSolver.add(new Date(), 300, 's').getTime();
    const toBeResult = new Date().getTime() + 1000 * 300;
    expect(expectResult).toBe(toBeResult);
});

test('add 10 minutes', () => {
    const expectResult = timeSolver.add(new Date(), 10, 'min').getTime();
    const toBeResult = new Date().getTime() + 1000 * 60 * 10;
    expect(expectResult).toBe(toBeResult);
});

test('add 5 days', () => {
    const expectResult = timeSolver.add(new Date(), 5, 'h').getTime();
    const toBeResult = new Date().getTime() + 1000 * 60 * 60 * 5;
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

test('subtract 300 second', () => {
    const expectResult = timeSolver.subtract(new Date(), 300, 's').getTime();
    const toBeResult = new Date().getTime() - 1000 * 300;
    expect(expectResult).toBe(toBeResult);
});

test('subtract 10 minutes', () => {
    const expectResult = timeSolver.subtract(new Date(), 10, 'min').getTime();
    const toBeResult = new Date().getTime() - 1000 * 60 * 10;
    expect(expectResult).toBe(toBeResult);
});

test('subtract 5 days', () => {
    const expectResult = timeSolver.subtract(new Date(), 5, 'h').getTime();
    const toBeResult = new Date().getTime() - 1000 * 60 * 60 * 5;
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


