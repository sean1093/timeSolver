/**
 * timeSolver.js
 * 
 * @description A small date time tool in JavaScript, see: https://github.com/sean1093/timeSolver/ for details
 * @version v1.2.0 
 * @author Sean Chou
 * @license [https://github.com/sean1093/timeSolver/blob/master/LICENSE] [Licensed under MIT]
 */

(function () {
    'use strict';
 
    //public 
    var timeSolver = {                              
        add: function(d, c, t) {
            t = _t(t);
            d = _v(d);
            c = (c === undefined) ? 0 : c;
            var result = null;
            switch(t) {
                case 0:
                    result = new Date(d.setMilliseconds(d.getMilliseconds()+c));
                break;
                case 1:
                    result = new Date(d.setSeconds(d.getSeconds()+c));
                break;
                case 2:
                    result = new Date(d.setMinutes(d.getMinutes()+c));
                break;
                case 3:
                    result = new Date(d.setHours(d.getHours()+c));
                break;
                case 4:
                    result = new Date(d.setDate(d.getDate()+c));
                break;
                case 5:
                    result = new Date(d.setMonth(d.getMonth()+c));
                break;
                case 6:
                    result = new Date(d.setFullYear(d.getFullYear()+c));
                break;
                default:
                    console.error(_errorMsg[0]);
                break;
            }
            return result;
        },
        subtract: function(d, c, t) {
            t = _t(t);
            d = _v(d);
            c = (c === undefined) ? 0 : c;
            var result = null;
            switch(t) {
                case 0:
                    result = new Date(d.setMilliseconds(d.getMilliseconds()-c));
                break;
                case 1:
                    result = new Date(d.setSeconds(d.getSeconds()-c));
                break;
                case 2:
                    result = new Date(d.setMinutes(d.getMinutes()-c));
                break;
                case 3:
                    result = new Date(d.setHours(d.getHours()-c));
                break;
                case 4:
                    result = new Date(d.setDate(d.getDate()-c));
                break;
                case 5:
                    result = new Date(d.setMonth(d.getMonth()-c));
                break;
                case 6:
                    result = new Date(d.setFullYear(d.getFullYear()-c));
                break;
                default:
                    console.error(_errorMsg[0]);
                break;
            }
            return result;      
        },
        equal: function(d1, d2) { //return true or false
            d1 = _v(d1);
            d2 = _v(d2);
            return d1.toString() === d2.toString();
        },
        between: function(d1, d2, t) {
            t = _t(t);
            d1 = _v(d1);
            d2 = _v(d2);
            var result = d2.getTime() - d1.getTime();
            var base = 1;
            switch(t) {
                case 0:
                    base = 1;
                break;
                case 1:
                    base = 1000;
                break;
                case 2:
                    base = 60000;
                break;
                case 3:
                    base = 3600000;
                break;
                case 4:
                    base = 86400000;
                break;
                case 5:
                    base = 2629800000;
                break;
                case 6:
                    base = 31557600000;
                break;
                default:
                    console.error(_errorMsg[0]);
                break;
            }
            return result / base;
        },
        after: function(d1, d2, t) { //if d1 after d2 or not
            return (this.between(d1, d2, t) > 0) ? false : true;
        },
        afterToday: function(d1) { //if d1 after today or not
            return this.after(d1, new Date(), 'd');
        },
        before: function(d1, d2, t) { //if d1 before d2 or not
            return (this.between(d1, d2, t) > 0) ? true : false;
        },
        beforeToday: function(d1) { //if d1 before today or not
            return this.before(d1, new Date(), 'd');
        },
        getString: function(d, f) { //get date string in given format
            f = (f === undefined)? 'YYYYMMDD' : f.toUpperCase();
            d = _v(d);
            var result = null;
            var year = d.getFullYear();
            var month = _appendZero(d.getMonth() + 1);
            var date = _appendZero(d.getDate());
            var hour = _appendZero(d.getHours());
            var min = _appendZero(d.getMinutes());
            var sec = _appendZero(d.getSeconds());
            var millsec = _appendZero(d.getMilliseconds());
            var YYYY = year.toString();
            var MM = month.toString();
            var DD = date.toString();
            var YYYYMMDD = YYYY + MM + DD;
            var HHMMSS = hour.toString() + ':' + min.toString() + ':' + sec.toString();
            var HHMMSSS = HHMMSS + '.' + millsec.toString();
            var dateString = {
                0: YYYY,
                1: YYYY + MM,
                2: YYYYMMDD,
                3: YYYY + '/' + MM + '/' + DD,
                4: YYYY + '-' + MM + '-' + DD,
                5: YYYY + '.' + MM + '.' + DD,
                6: MM + DD + YYYY,               
                7: DD + MM + YYYY,               
                8: MM + '/' + DD + '/' + YYYY,                 
                9: MM + '-' + DD + '-' + YYYY,                
                10: MM + '.' + DD + '.' + YYYY,
                11: YYYY + '/' + MM + '/' + DD + ' ' + HHMMSS,
                12: YYYY + '/' + MM + '/' + DD + ' ' + HHMMSSS,
                13: YYYY + '-' + MM + '-' + DD + ' ' + HHMMSS,
                14: YYYY + '-' + MM + '-' + DD + ' ' + HHMMSSS,
                15: YYYY + '.' + MM + '.' + DD + ' ' + HHMMSS,
                16: YYYY + '.' + MM + '.' + DD + ' ' + HHMMSS,
                17: YYYYMMDD + ' ' + HHMMSS,
                18: YYYYMMDD + ' ' + HHMMSSS,
                19: MM + '/' + DD + '/' + YYYY + ' ' + HHMMSS,
                20: MM + '/' + DD + '/' + YYYY + ' ' + HHMMSSS,
                21: MM + '-' + DD + '-' + YYYY + ' ' + HHMMSS,
                22: MM + '-' + DD + '-' + YYYY + ' ' + HHMMSSS,
                23: MM + '.' + DD + '.' + YYYY + ' ' + HHMMSS,
                24: MM + '.' + DD + '.' + YYYY + ' ' + HHMMSSS,
                25: HHMMSS,
                26: HHMMSSS
            }
            return dateString[_f[f]] ? dateString[_f[f]] : _errorMsg[0];
        },
        getAbbrWeek: function(d) { //return abbr. weekday name
            return _v(d) !== null ? _v(d).toString().substring(0, 3) : new Error(_errorMsg[1]);    
        },
        getFullWeek: function(d) { //return full weekday name
            return _w[_v(d).getDay()];
        },
        getAbbrMonth: function(d) { //return abbr. month name
            return _v(d) !== null ? _v(d).toString().substring(3, 7) : new Error(_errorMsg[1]);   
        },
        getFullMonth: function(d) { //return full month name
            return _m[_v(d).getMonth()];
        },
        isValid: function(st, f) { //input date string and return true/ false
            var result = true;
            if(f === undefined) {
                if(new Date(st) == 'Invalid Date') {
                    result = false;
                }           
            }
            else{
                f = f.toUpperCase();
                switch(_f[f]) {
                    case 3:
                        if (!_r.a.test(st)) {
                            result = false;
                        }
                    break;
                    case 4:
                        if (!_r.b.test(st)) {
                            result = false;
                        }
                    break;
                    case 5:
                        if (!_r.c.test(st)) {
                            result = false;
                        }
                    break;
                    case 11:
                        var str = st.split(' ');
                        if (!_r.a.test(str[0]) || !_r.t.test(str[1])) {
                            result = false;
                        }
                    break;
                    case 13:
                        var str = st.split(' ');
                        if (!_r.b.test(str[0]) || !_r.t.test(str[1])) {
                            result = false;
                        }
                    break;
                    case 15:
                        var str = st.split(' ');
                        if (!_r.c.test(str[0]) || !_r.t.test(str[1])) {
                            result = false;
                        }
                    break;
                    case 25:
                        var str = st.split(' ');
                        if (!_r.t.test(str[1])) {
                            result = false;
                        }
                    break;
                    default:
                        console.error(_errorMsg[0]);
                        result = null;
                    break;
                }
            }
            return result;
        },
        getQuarterByMonth: function(m) { // input month and return quarter
            if(1 <= m && m <= 3) return 1;
            else if(4 <= m && m <= 6) return 2;
            else if(7 <= m && m <= 9) return 3;
            else if(10 <= m && m <= 12) return 4;
            else return null;
        },
        getFirstMonthByQuarter: function(q) { // input quarter and return this quarter's first month
            if(q == 1) return 1;
            else if(q == 2) return 4;
            else if(q == 3) return 7;
            else if(q == 4) return 10;
            else return null;
        },
        timeArray: [],
        timeLookMax: 0,
        timeLookTotal: 0,
        timeLookStart: function() {
            this.timeArray.length = 0;
            this.timeLookMax = 0;
            this.timeLookTotal = 0;
            this.timeArray.push({label: 'start', time: new Date(), interval: 0});
        },
        timeLook: function(label) {
            var last = this.timeArray[this.timeArray.length-1];
            var now = new Date();
            var interval = this.between(last.time, now, 'S');
            this.timeLookTotal += interval;
            this.timeLookMax = interval > this.timeLookMax ? interval : this.timeLookMax;
            this.timeArray.push({label: label, time: new Date(), interval: interval});
        },
        timeLookReport: function() {
            var titleStyle = 'font-weight: bold; color: #3F51B5';
            var reportStyle = 'color: #2962FF';
            var infoStyle = 'color: #4CAF50';
            var maxStyle = 'color: #ff0000';
            var now = new Date();
            console.log('%c=================================', reportStyle);
            console.log('%c[timeSolver] Time Look Report', titleStyle);
            for(var i = 1; i < timeSolver.timeArray.length; i++) {
                var label = timeSolver.timeArray[i].label;
                var interval = timeSolver.timeArray[i].interval;
                var style = this.timeLookMax == interval ? maxStyle : reportStyle;
                console.log('%c['+ interval +'s] '+Math.round((interval/this.timeLookTotal)*100) +'%  '+label , style);
            }
            var end = new Date();
            console.log('%c[timeSolver] Spend '+this.between(now, end, 'S')+'s to create this report', infoStyle);
            console.log('%c[timeSolver] For more information: https://github.com/sean1093/timeSolver#timelook', infoStyle);
            console.log('%c=================================', reportStyle);
        }
    };

    
    //private 
    var _m = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var _w = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var _r = {
        a: /^(\d{4})([/])((1|3|5|7|8|0[13578]|1[02])\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])|(4|6|9|0[469]|11)\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[0])|(02|2)\2([1-9]|0[1-9]|1[0-9]|2[0-8]))$/,  
        b: /^(\d{4})([-])((1|3|5|7|8|0[13578]|1[02])\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])|(4|6|9|0[469]|11)\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[0])|(02|2)\2([1-9]|0[1-9]|1[0-9]|2[0-8]))$/,
        c: /^(\d{4})([.])((1|3|5|7|8|0[13578]|1[02])\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])|(4|6|9|0[469]|11)\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[0])|(02|2)\2([1-9]|0[1-9]|1[0-9]|2[0-8]))$/,
        t: /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/
    };
    var _f = {
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
    var _errorMsg = {
        0: '[timeSolver] Input Type Error',
        1: '[timeSolver] Invalid Date'
    }
    var _v = function(d) {
        var returnDate = typeof d != 'object' ? new Date(d) : d
        if(returnDate == 'Invalid Date') {
            console.error(_errorMsg[1]);
            return null;
        }
        return returnDate;
    };
    var _t = function(t) {
        t = (t === undefined)? 'MILLISECOND' : t.toUpperCase();
        if(t == 'MILLISECOND' || t == 'MILL') t = 0;
        else if(t == 'SECOND' || t == 'S') t = 1;
        else if(t == 'MINUTE' || t == 'MIN') t = 2;
        else if(t == 'HOUR' || t == 'H') t = 3;
        else if(t == 'DAY' || t == 'D') t = 4;
        else if(t == 'MONTH' || t == 'M') t = 5;
        else if(t == 'YEAR' || t == 'Y') t = 6;
        return t;
    };
    var _appendZero = function(s) {
        return s < 10 ? '0'+s : s;
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
        module.exports = timeSolver;
    else
        window.timeSolver = timeSolver;
})();
