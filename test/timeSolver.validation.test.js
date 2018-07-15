const timeSolver = require('./../src/1.2.0/timeSolver');

test('Valid date', () => {
    const expectResult = timeSolver.isValid('2018.12.12');
    expect(expectResult).toBe(true);
});

test('Valid date', () => {
    const expectResult = timeSolver.isValid('2018-12-12');
    expect(expectResult).toBe(true);
});

test('Valid date', () => {
    const expectResult = timeSolver.isValid('2018.12.12');
    expect(expectResult).toBe(true);
});

test('Invalid date', () => {
    const expectResult = timeSolver.isValid('2016/1212');
    expect(expectResult).toBe(false);
});

test('Invalid date', () => {
    const expectResult = timeSolver.isValid('1231212');
    expect(expectResult).toBe(false);
});

test('Valid date', () => {
    const expectResult = timeSolver.isValid('2004/12/12', 'yyyy/mm/dd');
    expect(expectResult).toBe(true);
});

test('Invalid date', () => {
    const expectResult = timeSolver.isValid('2015-12-12', 'yyyy/mm/dd');
    expect(expectResult).toBe(false);
});

test('Valid date', () => {
    const expectResult = timeSolver.isValid('2004-12-12', 'yyyy-mm-dd');
    expect(expectResult).toBe(true);
});

test('Invalid date', () => {
    const expectResult = timeSolver.isValid('2015/12/12', 'yyyy-mm-dd');
    expect(expectResult).toBe(false);
});

test('Valid date', () => {
    const expectResult = timeSolver.isValid('2004-12-12 12:12:33', 'yyyy-mm-dd hh:mm:ss');
    expect(expectResult).toBe(true);
});

test('Invalid date', () => {
    const expectResult = timeSolver.isValid('2004-12-12 12:12:73', 'yyyy-mm-dd hh:mm:ss');
    expect(expectResult).toBe(false);
});

