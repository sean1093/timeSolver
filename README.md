# timeSolver.js - v1.0.3

## [method]
	
### Add and Subtract
#### basic manipulate on date by different unit(type)
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
	
### Equal
#### return true/ false if date1 equals date2 
```js
equal(date1, date2)
```
* date1 and date2: standard JavaScript Date object or date string
	
	
### Between
#### count time by unit(type) between date1 and date2 
```js
between(date1, date2, type)
```
* date1 and date2: standard JavaScript Date object or date string
		
	
### Get Date String
#### get date time string by different format 
```js
getString(date, format)
```
* date1: standard JavaScript Date object or date string
* timeSolver format list:
	* "YYYYMMDD"
	* "YYYY/MM/DD"
	* "YYYY/MM/DD HH:MM:SS"
	* "YYYY/MM/DD HH:MM:SS.SSS"
	* "YYYY-MM-DD"
	* "YYYY-MM-DD HH:MM:SS"
	* "YYYY-MM-DD HH:MM:SS.SSS"

### Get Week and Month
#### get date's weekday or month name, it will return abbr. or full name by different method
```js
getAbbrWeek(date)
getFullWeek(date)
getAbbrMonth(date)
getFullMonth(date)
```
	
		
### isValid
#### return true/ false if dateString valid or not
```js
isValid(dateString, format)
```	
* dateString: date string
* timeSolver format list:
	* "YYYY/MM/DD"
	* "YYYY-MM-DD"
	* "YYYY.MM.DD"

		
## [Update log]
v1.0.3
Restructure

v1.0.2
Fix bug - between()

v1.0.1
Add new function - isValid()

v1.0.0
This is a small date time tool in JavaScript