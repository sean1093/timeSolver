/*!
timeSolver.js 
version: v1.0.4-dev
Author: Sean Chou
A small date time tool in JavaScript
see: https://github.com/sean1093/timeSolver/ for details
*/

var timeSolver = (function () {

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
	}
	var _t = function(t){
		if(t == undefined){
			t = "MILLISECOND";
		}
		return t = t.toUpperCase();
	}
	
	//public 					
	var t = {
		add: function(d, c, t){
			t = _t(t);
			d = _v(d);			
			switch(t){
				case "MILLISECOND":
					return new Date(d.setMilliseconds(d.getMilliseconds()+c));
				break;
				case "SECOND":
					return new Date(d.setSeconds(d.getSeconds()+c));
				break;
				case "MINUTE":
					return new Date(d.setMinutes(d.getMinutes()+c));
				break;
				case "HOUR":
					return new Date(d.setHours(d.getHours()+c));
				break;
				case "DAY":
					return new Date(d.setDate(d.getDate()+c));
				break;
				case "MONTH":
					return new Date(d.setMonth(d.getMonth()+c));
				break;
				case "YEAR":
					return new Date(d.setFullYear(d.getFullYear()+c));
				break;
				default:
					console.error("[timeSolver.js] Input Type Error");
				break;
			}
		},
		subtract: function(d, c, t){
			t = _t(t);
			d = _v(d);
			switch(t){
				case "MILLISECOND":
					return new Date(d.setMilliseconds(d.getMilliseconds()-c));
				break;
				case "SECOND":
					return new Date(d.setSeconds(d.getSeconds()-c));
				break;
				case "MINUTE":
					return new Date(d.setMinutes(d.getMinutes()-c));
				break;
				case "HOUR":
					return new Date(d.setHours(d.getHours()-c));
				break;
				case "DAY":
					return new Date(d.setDate(d.getDate()-c));
				break;
				case "MONTH":
					return new Date(d.setMonth(d.getMonth()-c));
				break;
				case "YEAR":
					return new Date(d.setFullYear(d.getFullYear()-c));
				break;
				default:
					console.error("[timeSolver.js] Input Type Error");
					return null;
				break;
			}		
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
			switch(t){
				case "MILLISECOND":
					return d2.getTime() - d1.getTime();
				break;
				case "SECOND":
					return (d2.getTime() - d1.getTime())/1000;
				break;
				case "MINUTE":
					return (d2.getTime() - d1.getTime())/60000;
				break;
				case "HOUR":
					return (d2.getTime() - d1.getTime())/3600000;
				break;
				case "DAY":
					return (d2.getTime() - d1.getTime())/86400000;
				break;
				case "MONTH":
					return (d2.getTime() - d1.getTime())/2629800000;
				break;
				case "YEAR":
					return (d2.getTime() - d1.getTime())/31557600000;
				break;
				default:
					console.error("[timeSolver.js] Input Type Error");
					return null;
				break;
			}
		},
		after: function(d1, d2, t){ //if d1 after d2 or not
			if(t.between(d1,d2,t)>0){
				return false;
			}
			else{
				return true;
			}
		},
		afterToday: function(d1){ //if d1 after today or not
			return t.after(d1, new Date(), "Day");
		},
		before: function(d1, d2, t){ //if d1 before d2 or not
			if(t.between(d1,d2,t)>0){
				return true;
			}
			else{
				return false;
			}
		},
		beforeToday: function(d1){ //if d1 before today or not
			return t.before(d1, new Date(), "Day");
		},
		getString: function(d, f){
			if(f === undefined){
				f = "YYYYMMDD";
			}
			f = f.toUpperCase();
			d = _v(d);

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
					return YYYYMMDD;
				break;
				case "YYYY/MM/DD":
					return YYYYMMDDwithSlash;
				break;			
				case "YYYY/MM/DD HH:MM:SS":
					return YYYYMMDDwithSlash+" "+HHMMSS;
				break;
				case "YYYY/MM/DD HH:MM:SS.SSS":
					return YYYYMMDDwithSlash+" "+HHMMSS+"."+millsec.toString();
				break;
				case "YYYY-MM-DD":
					return YYYYMMDDwithdash;
				break;
				case "YYYY-MM-DD HH:MM:SS":
					return YYYYMMDDwithdash+" "+HHMMSS;
				break;
				case "YYYY-MM-DD HH:MM:SS.SSS":
					return YYYYMMDDwithdash+" "+HHMMSS+"."+millsec.toString();
				break;
				default:
					console.error("[timeSolver.js] Input Type Error");
					return null;
				break;
			}
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
			if(f == undefined){
				if(new Date(st) != "Invalid Date"){
					return true;
				}
				else{
					return false;
				}			
			}
			else{
				f = f.toUpperCase();
				switch(f){
					case "YYYY/MM/DD":
						if (!_r.a.test(st)){
							return false;
						}
						return true;
					break;
					case "YYYY-MM-DD":
						if (!_r.b.test(st)){
							return false;
						}
						return true;
					break;
					case "YYYY.MM.DD":
						if (!_r.c.test(st)){
							return false;
						}
						return true;
					break;
					default:
						console.error("[timeSolver.js] Input Type Error");
						return null;
					break;
				}
			}
		}
	};

    return t;
}());
