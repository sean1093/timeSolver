const timeSolver = require('./../timeSolver');

test('Valid date', () => {
    const expectResult = timeSolver.isValid('2016/03/30');
    expect(expectResult).toBe(true);
});

test('Invalid date', () => {
    const expectResult = timeSolver.isValid('2016/1212');
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

