"use strict";
exports.__esModule = true;
var formatMap = {
    'YYYY': 0,
    'YYYYMM': 1,
    'YYYYMMDD': 2,
    'YYYY/MM/DD': 3,
    'YYYY-MM-DD': 4,
    'YYYY.MM.DD': 5,
    'MMDDYYYY': 6,
    'DDMMYYYY': 7,
    'MM/DD/YYYY': 8,
    'MM-DD-YYYY': 9,
    'MM.DD.YYYY': 10,
    'YYYY/MM/DD HH:MM:SS': 11,
    'YYYY/MM/DD HH:MM:SS.SSS': 12,
    'YYYY-MM-DD HH:MM:SS': 13,
    'YYYY-MM-DD HH:MM:SS.SSS': 14,
    'YYYY.MM.DD HH:MM:SS': 15,
    'YYYY.MM.DD HH:MM:SS.SSS': 16,
    'YYYYMMDD HH:MM:SS': 17,
    'YYYYMMDD HH:MM:SS.SSS': 18,
    'MM/DD/YYYY HH:MM:SS': 19,
    'MM/DD/YYYY HH:MM:SS.SSS': 20,
    'MM-DD-YYYY HH:MM:SS': 21,
    'MM-DD-YYYY HH:MM:SS.SSS': 22,
    'MM.DD.YYYY HH:MM:SS': 23,
    'MM.DD.YYYY HH:MM:SS.SSS': 24,
    'HH:MM:SS': 25,
    'HH:MM:SS.SSS': 26
};
var TYPE = {
    milli: ['millisecond', 'milli'],
    s: ['second', 's'],
    min: ['minute', 'min'],
    h: ['hour', 'h'],
    d: ['day', 'd'],
    m: ['month', 'm'],
    y: ['year', 'y']
};
var Operator;
(function (Operator) {
    Operator["Slash"] = "/";
    Operator["Comma"] = ",";
    Operator["Hyphen"] = "-";
    Operator["Dot"] = ".";
    Operator["Space"] = " ";
    Operator["Colon"] = ":";
})(Operator || (Operator = {}));
var tools = {
    appendZero: function (s) {
        return s < 10 ? '0' + s : s;
    },
    appendString: function (array) {
        return array.reduce(function (accumulator, currentValue) { return "" + accumulator + currentValue; });
    }
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
    if (TYPE.milli.indexOf(unit) > 0 || unit == TYPE.milli) {
        return date.getMilliseconds();
    }
    else if (TYPE.s.indexOf(unit) > 0 || unit == TYPE.s) {
        return date.getSeconds();
    }
    else if (TYPE.min.indexOf(unit) > 0 || unit == TYPE.min) {
        return date.getMinutes();
    }
    else if (TYPE.h.indexOf(unit) > 0 || unit == TYPE.h) {
        return date.getHours();
    }
    else if (TYPE.d.indexOf(unit) > 0 || unit == TYPE.d) {
        return date.getDate();
    }
    else if (TYPE.m.indexOf(unit) > 0 || unit == TYPE.m) {
        return date.getMonth();
    }
    else if (TYPE.y.indexOf(unit) > 0 || unit == TYPE.y) {
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
function getString(date, format) {
    if (date === void 0) { date = new Date(); }
    if (format === void 0) { format = 'YYYYMMDD'; }
    var dateObj = {
        year: getTimeUnitbyUnit(date, TYPE.y),
        month: tools.appendZero(getTimeUnitbyUnit(date, TYPE.m) + 1),
        day: tools.appendZero(getTimeUnitbyUnit(date, TYPE.d)),
        hour: tools.appendZero(getTimeUnitbyUnit(date, TYPE.h)),
        min: tools.appendZero(getTimeUnitbyUnit(date, TYPE.min)),
        sec: tools.appendZero(getTimeUnitbyUnit(date, TYPE.s)),
        millsec: tools.appendZero(getTimeUnitbyUnit(date, TYPE.milli))
    };
    var dateFormat = {
        YYYY: dateObj.year.toString(),
        MM: dateObj.month.toString(),
        DD: dateObj.day.toString(),
        HHMMSS: tools.appendString([
            dateObj.hour.toString(),
            Operator.Colon,
            dateObj.min.toString(),
            Operator.Colon,
            dateObj.sec.toString()
        ]),
        YYYYMMDD: '',
        HHMMSSS: ''
    };
    dateFormat.YYYYMMDD = tools.appendString([dateFormat.YYYY, dateFormat.MM, dateFormat.DD]);
    dateFormat.HHMMSSS = tools.appendString([dateFormat.HHMMSS, Operator.Dot, dateObj.millsec.toString()]);
    var dateString = {
        0: [dateFormat.YYYY],
        1: [dateFormat.YYYY, dateFormat.MM],
        2: [dateFormat.YYYYMMDD],
        3: [dateFormat.YYYY, Operator.Slash, dateFormat.MM, Operator.Slash, dateFormat.DD],
        4: [dateFormat.YYYY, Operator.Hyphen, dateFormat.MM, Operator.Hyphen, dateFormat.DD],
        5: [dateFormat.YYYY, Operator.Dot, dateFormat.MM, Operator.Dot, dateFormat.DD],
        6: [dateFormat.MM, dateFormat.DD, dateFormat.YYYY],
        7: [dateFormat.DD, dateFormat.MM, dateFormat.YYYY],
        8: [dateFormat.MM, Operator.Slash, dateFormat.DD, Operator.Slash, dateFormat.YYYY],
        9: [dateFormat.MM, Operator.Hyphen, dateFormat.DD, Operator.Hyphen, dateFormat.YYYY],
        10: [dateFormat.MM, Operator.Dot, dateFormat.DD, Operator.Dot, dateFormat.YYYY],
        11: [dateFormat.YYYY, Operator.Slash, dateFormat.MM, Operator.Slash, dateFormat.DD, Operator.Space, dateFormat.HHMMSS],
        12: [dateFormat.YYYY, Operator.Slash, dateFormat.MM, Operator.Slash, dateFormat.DD, Operator.Space, dateFormat.HHMMSSS],
        13: [dateFormat.YYYY, Operator.Hyphen, dateFormat.MM, Operator.Hyphen, dateFormat.DD, Operator.Space, dateFormat.HHMMSS],
        14: [dateFormat.YYYY, Operator.Hyphen, dateFormat.MM, Operator.Hyphen, dateFormat.DD, Operator.Space, dateFormat.HHMMSSS],
        15: [dateFormat.YYYY, Operator.Dot, dateFormat.MM, Operator.Dot, dateFormat.DD, Operator.Space, dateFormat.HHMMSS],
        16: [dateFormat.YYYY, Operator.Dot, dateFormat.MM, Operator.Dot, dateFormat.DD, Operator.Space, dateFormat.HHMMSS],
        17: [dateFormat.YYYYMMDD, Operator.Space, dateFormat.HHMMSS],
        18: [dateFormat.YYYYMMDD, Operator.Space, dateFormat.HHMMSSS],
        19: [dateFormat.MM, Operator.Slash, dateFormat.DD, Operator.Slash, dateFormat.YYYY, Operator.Space, dateFormat.HHMMSS],
        20: [dateFormat.MM, Operator.Slash, dateFormat.DD, Operator.Slash, dateFormat.YYYY, Operator.Space, dateFormat.HHMMSSS],
        21: [dateFormat.MM, Operator.Hyphen, dateFormat.DD, Operator.Hyphen, dateFormat.YYYY, Operator.Space, dateFormat.HHMMSS],
        22: [dateFormat.MM, Operator.Hyphen, dateFormat.DD, Operator.Hyphen, dateFormat.YYYY, Operator.Space, dateFormat.HHMMSSS],
        23: [dateFormat.MM, Operator.Dot, dateFormat.DD, Operator.Dot, dateFormat.YYYY, Operator.Space, dateFormat.HHMMSS],
        24: [dateFormat.MM, Operator.Dot, dateFormat.DD, Operator.Dot, dateFormat.YYYY, Operator.Space, dateFormat.HHMMSSS],
        25: [dateFormat.HHMMSS],
        26: [dateFormat.HHMMSSS]
    };
    console.log("format: " + format);
    console.log(formatMap[format]);
    console.log(dateString[formatMap[format]]);
    return dateString[formatMap[format]] ? tools.appendString(dateString[formatMap[format]]) : 'error';
}
exports.getString = getString;
;
function add(date, unit, type) {
    if (date === void 0) { date = new Date(); }
    if (unit === void 0) { unit = 0; }
    if (type === void 0) { type = 'milli'; }
    // validate date
    date = validate(date);
    var getResult = new Date(getTimeUnitbyUnit(date, type), unit);
    return new Date(setTimeUnitbyUnit(getResult, type));
}
exports.add = add;
;
