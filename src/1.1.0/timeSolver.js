/**
 * timeSolver.js
 * 
 * @description A small date time tool in JavaScript, see: https://github.com/sean1093/timeSolver/ for details
 * @version v1.1.0 
 * @author Sean Chou
 * @license [https://github.com/sean1093/timeSolver/blob/master/LICENSE] [Licensed under MIT]
 */

(function () {
    "use strict";
 
    //public 
    var timeSolver = {                              
        add: function(d, c, t){
            t = _t(t);
            d = _v(d);
            c = (c === undefined) ? 0 : c;
            var result = null;
            switch(t){
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
                    console.error("[timeSolver.js] Input Type Error");
                break;
            }
            return result;
        },
        subtract: function(d, c, t){
            t = _t(t);
            d = _v(d);
            c = (c === undefined) ? 0 : c;
            var result = null;
            switch(t){
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
                    console.error("[timeSolver.js] Input Type Error");
                break;
            }
            return result;      
        },
        equal: function(d1, d2){ //return true or false
            d1 = _v(d1);
            d2 = _v(d2);
            return d1.toString() === d2.toString();
        },
        between: function(d1, d2, t){
            t = _t(t);
            d1 = _v(d1);
            d2 = _v(d2);
            var result = null;
            switch(t){
                case 0:
                    result = d2.getTime() - d1.getTime();
                break;
                case 1:
                    result = (d2.getTime() - d1.getTime())/1000;
                break;
                case 2:
                    result = (d2.getTime() - d1.getTime())/60000;
                break;
                case 3:
                    result = (d2.getTime() - d1.getTime())/3600000;
                break;
                case 4:
                    result = (d2.getTime() - d1.getTime())/86400000;
                break;
                case 5:
                    result = (d2.getTime() - d1.getTime())/2629800000;
                break;
                case 6:
                    result = (d2.getTime() - d1.getTime())/31557600000;
                break;
                default:
                    console.error("[timeSolver.js] Input Type Error");
                break;
            }
            return result;
        },
        after: function(d1, d2, t){ //if d1 after d2 or not
            if(this.between(d1,d2,t)>0){
                return false;
            }
            else{
                return true;
            }
        },
        afterToday: function(d1){ //if d1 after today or not
            return this.after(d1, new Date(), "d");
        },
        before: function(d1, d2, t){ //if d1 before d2 or not
            if(this.between(d1,d2,t)>0){
                return true;
            }
            else{
                return false;
            }
        },
        beforeToday: function(d1){ //if d1 before today or not
            return this.before(d1, new Date(), "d");
        },
        getString: function(d, f){ //get date string in given format
            f = (f === undefined)? "YYYYMMDD" : f.toUpperCase();
            d = _v(d);
            var result = null;
            var year = d.getFullYear();
            var month = _appendZero(d.getMonth()+1);
            var date = _appendZero(d.getDate());
            var hour = _appendZero(d.getHours());
            var min = _appendZero(d.getMinutes());
            var sec = _appendZero(d.getSeconds());
            var millsec = _appendZero(d.getMilliseconds());
            var YYYY = year.toString();
            var MM = month.toString();
            var DD = date.toString();
            var YYYYMMDD = YYYY + MM + DD;
            var HHMMSS = hour.toString() + ":" + min.toString() + ":" + sec.toString();
            var HHMMSSS = HHMMSS + "." + millsec.toString();
            switch(f){
                case "YYYY":
                    result = YYYY;
                break;
                case "YYYYMM":
                    result = YYYY + MM;
                break;
                case "YYYYMMDD":
                    result = YYYYMMDD;
                break;
                case "YYYY/MM/DD":
                    result = YYYY + "/" + MM + "/" + DD;
                break; 
                case "YYYY-MM-DD":
                    result = YYYY + "-" + MM + "-" + DD;
                break; 
                case "YYYY.MM.DD":
                    result = YYYY + "." + MM + "." + DD;
                break;
                case "MMDDYYYY":
                    result = MM + DD + YYYY;
                break;
                case "MM/DD/YYYY":
                    result = MM + "/" + DD + "/" + YYYY;
                break; 
                case "MM-DD-YYYY":
                    result = MM + "-" + DD + "-" + YYYY;
                break; 
                case "MM.DD.YYYY":
                    result = MM + "." + DD + "." + YYYY;
                break; 
                case "YYYY/MM/DD HH:MM:SS":
                    result = YYYY + "/" + MM + "/" + DD + " " + HHMMSS;
                break;
                case "YYYY/MM/DD HH:MM:SS.SSS":
                    result = YYYY + "/" + MM + "/" + DD + " " + HHMMSSS;
                break;
                case "YYYY-MM-DD HH:MM:SS":
                    result = YYYY + "-" + MM + "-" + DD + " " + HHMMSS;
                break;
                case "YYYY-MM-DD HH:MM:SS.SSS":
                    result = YYYY + "-" + MM + "-" + DD + " " + HHMMSSS;
                break;
                case "YYYY.MM.DD HH:MM:SS":
                    result = YYYY + "." + MM + "." + DD + " " + HHMMSS;
                break;
                case "YYYY.MM.DD HH:MM:SS.SSS":
                    result = YYYY + "." + MM + "." + DD + " " + HHMMSS;
                break;
                case "YYYYMMDD HH:MM:SS":
                    result = YYYYMMDD + " " + HHMMSS;
                break;
                case "YYYYMMDD HH:MM:SS.SSS":
                    result = YYYYMMDD + " " + HHMMSSS;
                break;
                case "MM/DD/YYYY HH:MM:SS":
                    result = MM + "/" + DD + "/" + YYYY + " " + HHMMSS;
                break;
                case "MM/DD/YYYY HH:MM:SS.SSS":
                    result = MM + "/" + DD + "/" + YYYY + " " + HHMMSSS;
                break;
                case "MM-DD-YYYY HH:MM:SS":
                    result = MM + "-" + DD + "-" + YYYY + " " + HHMMSS;
                break;
                case "MM-DD-YYYY HH:MM:SS.SSS":
                    result = MM + "-" + DD + "-" + YYYY + " " + HHMMSSS;
                break;
                case "MM.DD.YYYY HH:MM:SS":
                    result = MM + "." + DD + "." + YYYY + " " + HHMMSS;
                break;
                case "MM.DD.YYYY HH:MM:SS.SSS":
                    result = MM + "." + DD + "." + YYYY + " " + HHMMSSS;
                break;
                case "HH:MM:SS":
                    result = HHMMSS;
                break;
                case "HH:MM:SS.SSS":
                    result = HHMMSSS;
                break;
                default:
                    console.error("[timeSolver.js] Input Type Error");
                break;
            }
            return result;
        },
        getAbbrWeek: function(d){ //return abbr. weekday name
            d = _v(d);
            return d.toString().substring(0,3);
        },
        getFullWeek: function(d){ //return full weekday name
            d = _v(d);
            return _w[d.getDay()];
        },
        getAbbrMonth: function(d){ //return abbr. month name
            d = _v(d);
            return d.toString().substring(3,7);
        },
        getFullMonth: function(d){ //return full month name
            d = _v(d);
            return _m[d.getMonth()];
        },
        isValid: function(st, f){ //input date string and return true/ false
            var result = true;
            if(f === undefined){
                if(new Date(st) == "Invalid Date"){
                    result = false;
                }           
            }
            else{
                f = f.toUpperCase();
                switch(f){
                    case "YYYY/MM/DD":
                        if (!_r.a.test(st)){
                            result = false;
                        }
                    break;
                    case "YYYY-MM-DD":
                        if (!_r.b.test(st)){
                            result = false;
                        }
                    break;
                    case "YYYY.MM.DD":
                        if (!_r.c.test(st)){
                            result = false;
                        }
                    break;
                    default:
                        console.error("[timeSolver.js] Input Type Error");
                        result = null;
                    break;
                }
            }
            return result;
        },
        timeArray: [],
        timeLookMax: 0,
        timeLookTotal: 0,
        timeLookStart: function() {
            this.timeArray.length = 0;
            this.timeLookMax = 0;
            this.timeLookTotal = 0;
            this.timeArray.push({label: "start", time: new Date(), interval: 0});
        },
        timeLook: function(label) {
            var last = this.timeArray[this.timeArray.length-1];
            var now = new Date();
            var interval = this.between(last.time, now, "S");
            this.timeLookTotal += interval;
            this.timeLookMax = interval > this.timeLookMax ? interval : this.timeLookMax;
            this.timeArray.push({label: label, time: new Date(), interval: interval});
        },
        timeLookReport: function() {
            var titleStyle = "font-weight: bold; color: #3F51B5";
            var reportStyle = "color: #2962FF";
            var infoStyle = "color: #4CAF50";
            var maxStyle = "color: #ff0000";
            var now = new Date();
            console.log("%c=================================", reportStyle);
            console.log("%c[timeSolver] Time Look Report", titleStyle);
            for(var i = 1; i < timeSolver.timeArray.length; i++) {
                var label = timeSolver.timeArray[i].label;
                var interval = timeSolver.timeArray[i].interval;
                var style = this.timeLookMax == interval ? maxStyle : reportStyle;
                console.log("%c["+ interval +"s] "+Math.round((interval/this.timeLookTotal)*100) +"%  "+label , style);
            }
            var end = new Date();
            console.log("%c[timeSolver] Spend "+this.between(now, end, "S")+"s to create this report", infoStyle);
            console.log("%c[timeSolver] For more information: https://github.com/sean1093/timeSolver#timelook", infoStyle);
            console.log("%c=================================", reportStyle);
        }
    };

    
    //private 
    var _m = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var _w = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var _r = {
        a: /^(\d{4})([/])((1|3|5|7|8|0[13578]|1[02])\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])|(4|6|9|0[469]|11)\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[0])|(02|2)\2([1-9]|0[1-9]|1[0-9]|2[0-8]))$/,  
        b: /^(\d{4})([-])((1|3|5|7|8|0[13578]|1[02])\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])|(4|6|9|0[469]|11)\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[0])|(02|2)\2([1-9]|0[1-9]|1[0-9]|2[0-8]))$/,
        c: /^(\d{4})([.])((1|3|5|7|8|0[13578]|1[02])\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])|(4|6|9|0[469]|11)\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[0])|(02|2)\2([1-9]|0[1-9]|1[0-9]|2[0-8]))$/
    };
    var _v = function(d){
        return (typeof d != "object")? new Date(d) : d;
    };
    var _t = function(t){
        t = (t === undefined)? "MILLISECOND" : t.toUpperCase();
        if(t == "MILLISECOND" || t == "MILL") t = 0;
        else if(t == "SECOND" || t == "S") t = 1;
        else if(t == "MINUTE" || t == "MIN") t = 2;
        else if(t == "HOUR" || t == "H") t = 3;
        else if(t == "DAY" || t == "D") t = 4;
        else if(t == "MONTH" || t == "M") t = 5;
        else if(t == "YEAR" || t == "Y") t = 6;
        return t;
    };
    var _appendZero = function(s) {
        return s < 10 ? "0"+s : s;
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
        module.exports = timeSolver;
    else
        window.timeSolver = timeSolver;
})();
