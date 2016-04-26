/*********************************************
* timeSolver.js
* version: v1.0.3
*
* This is a small date time tool in JavaScript
* Please go to see https://github.com/sean1093/timeSolver
*
* Author: Sean Chou
**********************************************/

var timeSolver = (function () {

	var _m = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	var _w = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	var _r = {
		a: /^(\d{4})([/])((1|3|5|7|8|0[13578]|1[02])\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])|(4|6|9|0[469]|11)\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[0])|(02|2)\2([1-9]|0[1-9]|1[0-9]|2[0-8]))$/,	
		b: /^(\d{4})([-])((1|3|5|7|8|0[13578]|1[02])\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])|(4|6|9|0[469]|11)\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[0])|(02|2)\2([1-9]|0[1-9]|1[0-9]|2[0-8]))$/,
		c: /^(\d{4})([.])((1|3|5|7|8|0[13578]|1[02])\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])|(4|6|9|0[469]|11)\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[0])|(02|2)\2([1-9]|0[1-9]|1[0-9]|2[0-8]))$/
	};
						
	var t = {
		add: function(d, c, t){
			if(t == undefined){
				t = "MILLISECOND";
			}
			if(typeof d != "object"){
				d = new Date(d);
			}
			t = t.toUpperCase();
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
			if(t == undefined){
				t = "MILLISECOND";
			}
			if(typeof d != "object"){
				d = new Date(d);
			}
			t = t.toUpperCase();
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
			if(typeof d1 != "object"){
				d1 = new Date(d1);
			}
			if(typeof d2 != "object"){
				d2 = new Date(d2);
			}
			return d1.toString() === d2.toString();
		},
		between: function(d1, d2, type){
			if(t == undefined){
				t = "MILLISECOND";
			}
			if(typeof d1 != "object"){
				d1 = new Date(d1);
			}
			if(typeof d2 != "object"){
				d2 = new Date(d2);
			}
			type = type.toUpperCase();
			switch(type){
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
		getString: function(d, f){
			if(f == undefined){
				t = "MILLISECOND";
			}
			if(typeof d != "object"){
				d = new Date(d);
			}
			var year = d.getFullYear();
			var month = (d.getMonth()+1);
			var date = d.getDate();
			var hour = d.getHours();
			var min = d.getMinutes();
			var sec = d.getSeconds();
			var millsec = d.getMilliseconds();
			f = f.toUpperCase();
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
			if(typeof d != "object"){
				d = new Date(d);
			}
			return d.toString().substring(0,3);
		},
		getFullWeek: function(d){ //return full weekday name
			if(typeof d != "object"){
				d = new Date(d);
			}
			return _w[d.getDay()];
		},
		getAbbrMonth: function(d){ //return abbr. month name
			if(typeof d != "object"){
				d = new Date(d);
			}
			return d.toString().substring(3,7);
		},
		getFullMonth: function(d){ //return full month name
			if(typeof d != "object"){
				d = new Date(d);
			}
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


