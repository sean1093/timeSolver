# timeSolver.js - v1.0 (1.0.5)

A small library for manipulating, validating and formatting JavaScript date object.

### [How to use]
You need to use timeSolver object to manipulate JavaScript date object.
For example, if you want to get datetime string with format "YYYYMMDD", you need to do by following:
```js
var dateString = timeSolver.getString(new Date(), "YYYYMMDD");
```

### [method]

#### Add and Subtract
basic manipulate on date by different unit(type)
```js
add(date, count, type)
subtract(date, count, type)
```
* date: standard JavaScript Date object or date string
* count: a number you want to add or subtract on date
* type: add or subtract by this unit 
* timeSolver type list:
	* "MILLISECOND"
	* "SECOND"
	* "MINUTE"
	* "HOUR"
	* "DAY"
	* "MONTH"
	* "YEAR"	
	

#### Equal
return true/ false if date1 equals date2 
```js
equal(date1, date2)
```
* date1 and date2: standard JavaScript Date object or date string
	
	
#### After
return true/ false if date1 after date2 
```js
after(date1, date2, type)
```
* date1 and date2: standard JavaScript Date object or date string
* type: by this unit 


#### After Today
return true/ false if date after today 
```js
afterToday(date)
```
* date: standard JavaScript Date object or date string


#### Before
return true/ false if date1 before date2 
```js
before(date1, date2, type)
```
* date1 and date2: standard JavaScript Date object or date string
* type: by this unit 


#### Before Today
return true/ false if date after today 
```js
beforeToday(date)
```
* date: standard JavaScript Date object or date string


#### Between
count time by unit(type) between date1 and date2 
```js
between(date1, date2, type)
```
* date1 and date2: standard JavaScript Date object or date string		
	

#### Get Date String
get date time string by different format 
```js
getString(date, format)
```
* date: standard JavaScript Date object or date string
* timeSolver format list:
	* "YYYYMMDD"
	* "YYYY/MM/DD"
	* "YYYY/MM/DD HH:MM:SS"
	* "YYYY/MM/DD HH:MM:SS.SSS"
	* "YYYY-MM-DD"
	* "YYYY-MM-DD HH:MM:SS"
	* "YYYY-MM-DD HH:MM:SS.SSS"
	* "YYYY.MM.DD"
	* "YYYY.MM.DD HH:MM:SS"
	* "YYYY.MM.DD HH:MM:SS.SSS"
	* "MM/DD/YYYY"
	* "MM-DD-YYYY"
	* "MM.DD.YYYY"

#### Get Week and Month
get date's weekday or month name, it will return abbr. or full name by different method
```js
getAbbrWeek(date)
getFullWeek(date)
getAbbrMonth(date)
getFullMonth(date)
```
	
#### isValid
return true/ false if dateString valid or not
```js
isValid(dateString, format)
```
* dateString: date string
* timeSolver format list:
	* "YYYY/MM/DD"
	* "YYYY-MM-DD"
	* "YYYY.MM.DD"

		
### [Update log]
* v1.0.6 Update new feature
* v1.0.5 Module load compatibility
* v1.0.4 Bug fix
* v1.0.3 Restructure
* v1.0.2 Bug fix: between()
* v1.0.1 Add new function: isValid()

