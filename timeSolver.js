"use strict";
exports.__esModule = true;
var TYPE = {
    milli: ['millisecond', 'milli'],
    s: ['second', 's'],
    min: ['minute', 'min'],
    h: ['hour', 'h'],
    d: ['day', 'd'],
    m: ['month', 'm'],
    y: ['year', 'y']
};
var validate = function (d) {
    var returnDate = typeof d != 'object' ? new Date(d) : d;
    if (returnDate == 'Invalid Date') {
        console.error('error');
        return null;
    }
    return returnDate;
};
var getTimeUnitbyUnit = function (date, unit) {
    if (TYPE.milli.indexOf(unit) > 0) {
        return date.getMilliseconds();
    }
    else if (TYPE.s.indexOf(unit) > 0) {
        return date.getSeconds();
    }
    else if (TYPE.min.indexOf(unit) > 0) {
        return date.getMinutes();
    }
    else if (TYPE.h.indexOf(unit) > 0) {
        return date.getHours();
    }
    else if (TYPE.d.indexOf(unit) > 0) {
        return date.getDate();
    }
    else if (TYPE.m.indexOf(unit) > 0) {
        return date.getMonth();
    }
    else if (TYPE.y.indexOf(unit) > 0) {
        return date.getFullYear();
    }
    else {
        console.log('out');
    }
};
var setTimeUnitbyUnit = function (date, unit) {
    if (TYPE.milli.indexOf(unit) > 0) {
        return date.setMilliseconds();
    }
    else if (TYPE.s.indexOf(unit) > 0) {
        return date.setSeconds();
    }
    else if (TYPE.min.indexOf(unit) > 0) {
        return date.setMinutes();
    }
    else if (TYPE.h.indexOf(unit) > 0) {
        return date.setHours();
    }
    else if (TYPE.d.indexOf(unit) > 0) {
        return date.setDate();
    }
    else if (TYPE.m.indexOf(unit) > 0) {
        return date.setMonth();
    }
    else if (TYPE.y.indexOf(unit) > 0) {
        return date.setFullYear();
    }
    else {
        console.log('out');
    }
};
function add(date, unit, type) {
    if (date === void 0) { date = new Date(); }
    if (unit === void 0) { unit = 0; }
    if (type === void 0) { type = 'milli'; }
    // validate date
    date = validate(date);
    var getResult = new Date(getTimeUnitbyUnit(date, type) + unit);
    return new Date(setTimeUnitbyUnit(getResult, type));
}
exports.add = add;
;
