const timeSolver = require('./../timeSolver');

test('compare equals', () => {
    const expectResult = timeSolver.equal(new Date(), new Date());
    expect(expectResult).toBe(true);
});

test('compare equals after manipulating', () => {
    const expectResult = timeSolver.equal(new Date(), 
        timeSolver.add(
            timeSolver.subtract(new Date(), 14, 'month'), 
        14, 'month')
    );
    expect(expectResult).toBe(true);
});

test('2015/11/18 after 2015/12/12 => false', () => {
    const expectResult = timeSolver.after(new Date('2014/12/12'), new Date('2015/12/12'));
    expect(expectResult).toBe(false);
});

test('2015/11/18 before 2015/12/12 => true', () => {
    const expectResult = timeSolver.before(new Date('2014/12/12'), new Date('2015/12/12'));
    expect(expectResult).toBe(true);
});

test('2015/11/18 after today => false', () => {
    const expectResult = timeSolver.afterToday(new Date('2015/11/18 '));
    expect(expectResult).toBe(false);
});

test('2015/11/18 before today => true', () => {
    const expectResult = timeSolver.beforeToday(new Date('2015/11/18 '));
    expect(expectResult).toBe(true);
});

