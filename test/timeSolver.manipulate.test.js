const timeSolver = require('./../src/1.2.0/timeSolver');

test('add 300 second', () => {
    const date = new Date();
    const copiedDate = new Date(date.getTime());
    const expectResult = timeSolver.add(date, 300, 's').getTime();
    const toBeResult = copiedDate.getTime() + 1000 * 300;
    expect(expectResult).toBe(toBeResult);
});

test('add 10 minutes', () => {
    const date = new Date();
    const copiedDate = new Date(date.getTime());
    const expectResult = timeSolver.add(date, 10, 'min').getTime();
    const toBeResult = copiedDate.getTime() + 1000 * 60 * 10;
    expect(expectResult).toBe(toBeResult);
});

test('add 5 days', () => {
    const date = new Date();
    const copiedDate = new Date(date.getTime());
    const expectResult = timeSolver.add(date, 5, 'h').getTime();
    const toBeResult = copiedDate.getTime() + 1000 * 60 * 60 * 5;
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
    const date = new Date();
    const copiedDate = new Date(date.getTime());
    const expectResult = timeSolver.subtract(date, 300, 's').getTime();
    const toBeResult = copiedDate.getTime() - 1000 * 300;
    expect(expectResult).toBe(toBeResult);
});

test('subtract 10 minutes', () => {
    const date = new Date();
    const copiedDate = new Date(date.getTime());
    const expectResult = timeSolver.subtract(date, 10, 'min').getTime();
    const toBeResult = copiedDate.getTime() - 1000 * 60 * 10;
    expect(expectResult).toBe(toBeResult);
});

test('subtract 5 days', () => {
    const date = new Date();
    const copiedDate = new Date(date.getTime());
    const expectResult = timeSolver.subtract(date, 5, 'h').getTime();
    const toBeResult = copiedDate.getTime() - 1000 * 60 * 60 * 5;
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


