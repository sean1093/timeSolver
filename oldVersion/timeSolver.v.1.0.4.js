/*!
timeSolver.js 
version: v1.0.4
Author: Sean Chou
A small date time tool in JavaScript
see: https://github.com/sean1093/timeSolver/ for details
*/
   	
var timeSolver = (function () {
	"use strict"; //strict mode
	//private 
	var _m = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	var _w = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	var _r = {
		a: /^(\d{4})([/])((1|3|5|7|8|0[13578]|1[02])\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])|(4|6|9|0[469]|11)\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[0])|(02|2)\2([1-9]|0[1-9]|1[0-9]|2[0-8]))$/,	
		b: /^(\d{4})([-])((1|3|5|7|8|0[13578]|1[02])\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])|(4|6|9|0[469]|11)\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[0])|(02|2)\2([1-9]|0[1-9]|1[0-9]|2[0-8]))$/,
		c: /^(\d{4})([.])((1|3|5|7|8|0[13578]|1[02])\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])|(4|6|9|0[469]|11)\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[0])|(02|2)\2([1-9]|0[1-9]|1[0-9]|2[0-8]))$/
	};
	var _v = function(d){
		if(typeof d != "object"){
			d = new Date(d);
		}
		return d;
	};
	var _t = function(t){
		if(t === undefined){
			t = "MILLISECOND";
		}
		return (t = t.toUpperCase());
	};
	 
	//public 					
	var t = {
		add: function(d, c, t){
			t = _t(t);
			d = _v(d);
			if(c === undefined){
				c = 0;
			}
			var result = null;			
			switch(t){
				case "MILLISECOND":
					result = new Date(d.setMilliseconds(d.getMilliseconds()+c));
				break;
				case "SECOND":
					result = new Date(d.setSeconds(d.getSeconds()+c));
				break;
				case "MINUTE":
					result = new Date(d.setMinutes(d.getMinutes()+c));
				break;
				case "HOUR":
					result = new Date(d.setHours(d.getHours()+c));
				break;
				case "DAY":
					result = new Date(d.setDate(d.getDate()+c));
				break;
				case "MONTH":
					result = new Date(d.setMonth(d.getMonth()+c));
				break;
				case "YEAR":
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
			if(c === undefined){
				c = 0;
			}
			var result = null;
			switch(t){
				case "MILLISECOND":
					result = new Date(d.setMilliseconds(d.getMilliseconds()-c));
				break;
				case "SECOND":
					result = new Date(d.setSeconds(d.getSeconds()-c));
				break;
				case "MINUTE":
					result = new Date(d.setMinutes(d.getMinutes()-c));
				break;
				case "HOUR":
					result = new Date(d.setHours(d.getHours()-c));
				break;
				case "DAY":
					result = new Date(d.setDate(d.getDate()-c));
				break;
				case "MONTH":
					result = new Date(d.setMonth(d.getMonth()-c));
				break;
				case "YEAR":
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
				case "MILLISECOND":
					result = d2.getTime() - d1.getTime();
				break;
				case "SECOND":
					result = (d2.getTime() - d1.getTime())/1000;
				break;
				case "MINUTE":
					result = (d2.getTime() - d1.getTime())/60000;
				break;
				case "HOUR":
					result = (d2.getTime() - d1.getTime())/3600000;
				break;
				case "DAY":
					result = (d2.getTime() - d1.getTime())/86400000;
				break;
				case "MONTH":
					result = (d2.getTime() - d1.getTime())/2629800000;
				break;
				case "YEAR":
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
			return this.after(d1, new Date(), "Day");
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
			return this.before(d1, new Date(), "Day");
		},
		getString: function(d, f){ //get date string in given format
			if(f === undefined){
				f = "YYYYMMDD";
			}
			f = f.toUpperCase();
			d = _v(d);
			var result = null;
			var year = d.getFullYear();
			var month = (d.getMonth()+1);
			var date = d.getDate();
			var hour = d.getHours();
			var min = d.getMinutes();
			var sec = d.getSeconds();
			var millsec = d.getMilliseconds();			
			var YYYYMMDD = year.toString()+month.toString()+date.toString();
			var YYYYMMDDwithSlash = year.toString()+"/"+month.toString()+"/"+date.toString();
			var YYYYMMDDwithdash = year.toString()+"-"+month.toString()+"-"+date.toString();
			var HHMMSS = hour.toString()+":"+min.toString()+":"+sec.toString();
			switch(f){
				case "YYYYMMDD":
					result = YYYYMMDD;
				break;
				case "YYYY/MM/DD":
					result =  YYYYMMDDwithSlash;
				break;			
				case "YYYY/MM/DD HH:MM:SS":
					result =  YYYYMMDDwithSlash+" "+HHMMSS;
				break;
				case "YYYY/MM/DD HH:MM:SS.SSS":
					result =  YYYYMMDDwithSlash+" "+HHMMSS+"."+millsec.toString();
				break;
				case "YYYY-MM-DD":
					result =  YYYYMMDDwithdash;
				break;
				case "YYYY-MM-DD HH:MM:SS":
					result =  YYYYMMDDwithdash+" "+HHMMSS;
				break;
				case "YYYY-MM-DD HH:MM:SS.SSS":
					result =  YYYYMMDDwithdash+" "+HHMMSS+"."+millsec.toString();
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
		}
	};
    return t;
}());
