/*********************************************
* timeSolver.js
* version: v1.0.2
*
* This is a small date time tool in JavaScript
* Please go to see https://github.com/sean1093/smallTool/
*
* Author: Sean Chou
**********************************************/

var timeSolver = {
	add: function(d, count, type){
		if(typeof d != "object"){
			d = new Date(d);
		}
		type = type.toUpperCase();
		switch(type){
			case "MILLISECOND":
				return new Date(d.setMilliseconds(d.getMilliseconds()+count));
			break;
			case "SECOND":
				return new Date(d.setSeconds(d.getSeconds()+count));
			break;
			case "MINUTE":
				return new Date(d.setMinutes(d.getMinutes()+count));
			break;
			case "HOUR":
				return new Date(d.setHours(d.getHours()+count));
			break;
			case "DAY":
				return new Date(d.setDate(d.getDate()+count));
			break;
			case "MONTH":
				return new Date(d.setMonth(d.getMonth()+count));
			break;
			case "YEAR":
				return new Date(d.setFullYear(d.getFullYear()+count));
			break;
			default:
				console.error("[timeSolver.js] Input type error");
			break;
		}
	},
	subtract: function(d, count, type){
		if(typeof d != "object"){
			d = new Date(d);
		}
		type = type.toUpperCase();
		switch(type){
			case "MILLISECOND":
				return new Date(d.setMilliseconds(d.getMilliseconds()-count));
			break;
			case "SECOND":
				return new Date(d.setSeconds(d.getSeconds()-count));
			break;
			case "MINUTE":
				return new Date(d.setMinutes(d.getMinutes()-count));
			break;
			case "HOUR":
				return new Date(d.setHours(d.getHours()-count));
			break;
			case "DAY":
				return new Date(d.setDate(d.getDate()-count));
			break;
			case "MONTH":
				return new Date(d.setMonth(d.getMonth()-count));
			break;
			case "YEAR":
				return new Date(d.setFullYear(d.getFullYear()-count));
			break;
			default:
				console.error("[timeSolver.js] Input type error");
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
				console.error("[timeSolver.js] Input type error");
				return null;
			break;
		}
	},
	getString: function(d, format){
		if(typeof d != "object"){
			d = new Date(d);
		}
		var returnString;
		var year = d.getFullYear();
		var month = (d.getMonth()+1);
		var date = d.getDate();
		var hour = d.getHours();
		var min = d.getMinutes();
		var sec = d.getSeconds();
		var millsec = d.getMilliseconds();
		format = format.toUpperCase();
		var YYYYMMDD = year.toString()+month.toString()+date.toString();
		var YYYYMMDDwithSlash = year.toString()+"/"+month.toString()+"/"+date.toString();
		var YYYYMMDDwithdash = year.toString()+"-"+month.toString()+"-"+date.toString();
		var HHMMSS = hour.toString()+":"+min.toString()+":"+sec.toString();
		switch(format){
			case "YYYYMMDD":
				returnString = YYYYMMDD;
			break;
			case "YYYY/MM/DD":
				returnString = YYYYMMDDwithSlash;
			break;			
			case "YYYY/MM/DD HH:MM:SS":
				returnString = YYYYMMDDwithSlash+" "+HHMMSS;
			break;
			case "YYYY/MM/DD HH:MM:SS.SSS":
				returnString = YYYYMMDDwithSlash+" "+HHMMSS+"."+millsec.toString();
			break;
			case "YYYY-MM-DD":
				returnString = YYYYMMDDwithdash;
			break;
			case "YYYY-MM-DD HH:MM:SS":
				returnString = YYYYMMDDwithdash+" "+HHMMSS;
			break;
			case "YYYY-MM-DD HH:MM:SS.SSS":
				returnString = YYYYMMDDwithdash+" "+HHMMSS+"."+millsec.toString();
			break;
			default:
				console.error("[timeSolver.js] Input type error");
				return null;
			break;
		}
		return returnString;
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
		var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		return weekday[d.getDay()];
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
		var weekday = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		return weekday[d.getMonth()];
	},
	isValid: function(st, format){ //input date string and return true/ false
		var dateReg;
		if(format == null){
			if(new Date(st) != "Invalid Date"){
				return true;
			}
			else{
				return false;
			}			
		}
		else{
			format = format.toUpperCase();
			switch(format){
				case "YYYY/MM/DD":
					// dateReg = /^(10|11|12|13|14|15|16|17|18|19|20|21|22)\d\d([/])((1|3|5|7|8|0[13578]|1[02])\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])|(4|6|9|0[469]|11)\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[0])|(02|2)\2([1-9]|0[1-9]|1[0-9]|2[0-8]))$/;	
					dateReg = /^(\d{4})([/])((1|3|5|7|8|0[13578]|1[02])\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])|(4|6|9|0[469]|11)\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[0])|(02|2)\2([1-9]|0[1-9]|1[0-9]|2[0-8]))$/;	
					if (!dateReg.test(st)){
						return false;
					}
					return true;
				break;
				case "YYYY-MM-DD":
					dateReg = /^(\d{4})([-])((1|3|5|7|8|0[13578]|1[02])\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])|(4|6|9|0[469]|11)\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[0])|(02|2)\2([1-9]|0[1-9]|1[0-9]|2[0-8]))$/;	
					if (!dateReg.test(st)){
						return false;
					}
					return true;
				break;
				case "YYYY.MM.DD":
					dateReg = /^(\d{4})([.])((1|3|5|7|8|0[13578]|1[02])\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])|(4|6|9|0[469]|11)\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[0])|(02|2)\2([1-9]|0[1-9]|1[0-9]|2[0-8]))$/;	
					if (!dateReg.test(st)){
						return false;
					}
					return true;
				break;
				default:
					console.error("[timeSolver.js] Input type error");
					return null;
				break;
			}
		}
	}
};
