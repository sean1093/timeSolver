
const formatMap = {
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
}

const TYPE = {
    milli: ['millisecond', 'milli'],
    s:['second', 's'],
    min:['minute', 'min'],
    h:['hour', 'h'],
    d:['day', 'd'],
    m:['month', 'm'],
    y:['year', 'y'],
};

enum Operator {
    Slash = '/',
    Comma = ',',
    Hyphen = '-',
    Dot = '.',
    Space = ' ',
    Colon = ':'
}
class Tools {
    public appendZero(str: number) {
        return str < 10 ? `0${str}` : str;
    };

    public appendString(array: Array<any>) {
        return array.reduce((accumulator, currentValue) => `${accumulator}${currentValue}`);
    };

    public getTimeUnitbyUnit(date: Date, type: string) {
        if (TYPE.milli.indexOf(type) > 0) {
            return date.getMilliseconds();
        } else if (TYPE.s.indexOf(type) > 0) {
            return date.getSeconds();
        } else if (TYPE.min.indexOf(type) > 0) {
            return date.getMinutes();
        } else if (TYPE.h.indexOf(type) > 0) {
            return date.getHours();
        } else if (TYPE.d.indexOf(type) > 0) {
            return date.getDate();
        } else if (TYPE.m.indexOf(type) > 0) {
            return date.getMonth();
        } else if (TYPE.y.indexOf(type) > 0) {
            console.log(date);
            return date.getFullYear();
        } else {
            console.log('out')
        }
    };

    public setTimeUnitbyUnit(date: Date, type: string, newDate: number): number {
        if (TYPE.milli.indexOf(type) > 0) {
            return date.setMilliseconds(newDate);
        } else if (TYPE.s.indexOf(type) > 0) {
            return date.setSeconds(newDate);
        } else if (TYPE.min.indexOf(type) > 0) {
            return date.setMinutes(newDate);
        } else if (TYPE.h.indexOf(type) > 0) {
            return date.setHours(newDate);
        } else if (TYPE.d.indexOf(type) > 0) {
            return date.setDate(newDate);
        } else if (TYPE.m.indexOf(type) > 0) {
            return date.setMonth(newDate);
        } else if (TYPE.y.indexOf(type) > 0) {
            return date.setFullYear(newDate);
        } else {
            console.log('out');
        }
        return 0;
    };

    public validate(d: any) {
        const returnDate = (typeof d !== 'object' ? new Date(d) : d);
        if(returnDate == 'Invalid Date') {
            console.error('error');
            return null;
        }
        return returnDate;
    };
};

const _ = new Tools();

export function getString(date: Date = new Date(), format: string = 'YYYYMMDD'): string { 
    const dateObj = {
        year: _.getTimeUnitbyUnit(date, 'y'),
        month: _.appendZero(_.getTimeUnitbyUnit(date, 'm') + 1),
        day: _.appendZero(_.getTimeUnitbyUnit(date, 'd')),
        hour: _.appendZero(_.getTimeUnitbyUnit(date, 'h')),
        min: _.appendZero(_.getTimeUnitbyUnit(date, 'min')),
        sec: _.appendZero(_.getTimeUnitbyUnit(date, 's')),
        millsec: _.appendZero(_.getTimeUnitbyUnit(date, 'milli'))
    };

    // data format
    const df = {
        YYYY: dateObj.year.toString(),
        MM: dateObj.month.toString(),
        DD: dateObj.day.toString(),
        HHMMSS: _.appendString([
            dateObj.hour.toString(), 
            Operator.Colon, 
            dateObj.min.toString(), 
            Operator.Colon, 
            dateObj.sec.toString()
        ]),
        YYYYMMDD: '',
        HHMMSSS: ''
    }
    df.YYYYMMDD = _.appendString([df.YYYY, df.MM, df.DD]);
    df.HHMMSSS = _.appendString([df.HHMMSS, Operator.Dot, dateObj.millsec.toString()]);

    // data string
    const ds = {
        0: [df.YYYY],
        1: [df.YYYY, df.MM],
        2: [df.YYYYMMDD],
        3: [df.YYYY, Operator.Slash, df.MM, Operator.Slash, df.DD],
        4: [df.YYYY, Operator.Hyphen, df.MM, Operator.Hyphen, df.DD],
        5: [df.YYYY, Operator.Dot, df.MM, Operator.Dot, df.DD],
        6: [df.MM, df.DD, df.YYYY],               
        7: [df.DD, df.MM, df.YYYY],               
        8: [df.MM, Operator.Slash, df.DD, Operator.Slash, df.YYYY],                 
        9: [df.MM, Operator.Hyphen, df.DD, Operator.Hyphen, df.YYYY],                
        10: [df.MM, Operator.Dot, df.DD, Operator.Dot, df.YYYY],
        11: [df.YYYY, Operator.Slash, df.MM, Operator.Slash, df.DD, Operator.Space, df.HHMMSS],
        12: [df.YYYY, Operator.Slash, df.MM, Operator.Slash, df.DD, Operator.Space, df.HHMMSSS],
        13: [df.YYYY, Operator.Hyphen, df.MM, Operator.Hyphen, df.DD, Operator.Space, df.HHMMSS],
        14: [df.YYYY, Operator.Hyphen, df.MM, Operator.Hyphen, df.DD, Operator.Space, df.HHMMSSS],
        15: [df.YYYY, Operator.Dot, df.MM, Operator.Dot, df.DD, Operator.Space, df.HHMMSS],
        16: [df.YYYY, Operator.Dot, df.MM, Operator.Dot, df.DD, Operator.Space, df.HHMMSS],
        17: [df.YYYYMMDD, Operator.Space, df.HHMMSS],
        18: [df.YYYYMMDD, Operator.Space, df.HHMMSSS],
        19: [df.MM, Operator.Slash, df.DD, Operator.Slash, df.YYYY, Operator.Space, df.HHMMSS],
        20: [df.MM, Operator.Slash, df.DD, Operator.Slash, df.YYYY, Operator.Space, df.HHMMSSS],
        21: [df.MM, Operator.Hyphen, df.DD, Operator.Hyphen, df.YYYY, Operator.Space, df.HHMMSS],
        22: [df.MM, Operator.Hyphen, df.DD, Operator.Hyphen, df.YYYY, Operator.Space, df.HHMMSSS],
        23: [df.MM, Operator.Dot, df.DD, Operator.Dot, df.YYYY, Operator.Space, df.HHMMSS],
        24: [df.MM, Operator.Dot, df.DD, Operator.Dot, df.YYYY, Operator.Space, df.HHMMSSS],
        25: [df.HHMMSS],
        26: [df.HHMMSSS]
    };
    return ds[formatMap[format]] ? _.appendString(ds[formatMap[format]]) : 'error';
};

export function add(date: Date = new Date(), unit: number = 0, type: string = 'milli') {
    // validate date
    date = _.validate(date);
    console.log(date)
    console.log(typeof date)
    const getValue = _.getTimeUnitbyUnit(date, type) || 0;
    console.log(getValue)
    const getResult = (getValue + unit);
    console.log(getResult)
    return new Date(_.setTimeUnitbyUnit(date, type, getResult));
};



