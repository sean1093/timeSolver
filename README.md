# timeSolver.js

A small library for manipulating, validating and formatting JavaScript date object.

#### <font color="red"> Current Version : v1.0.6 <font>

## Getting Start

Include <code>timeSolver</code> in your HTML page. 
```html
<script type="text/javascript" src="http://sean1093.github.io/lib/js/timeSolver/1.0.6/timeSolver.min.js"></script>
```

You need to use timeSolver object to manipulate JavaScript date object.
For example, if you want to get datetime string with format "YYYYMMDD", you need to do by following:
```js
var dateString = timeSolver.getString(new Date(), "YYYYMMDD");
```

## Method 

### Add and Subtract
You can use this basic manipulate on date, add or subtract, by different time unit(type)
```js
var afterAdd = timeSolver.add(date, count, type);
var afterSubtract = timeSolver.subtract(date, count, type);
```

    + date: standard JavaScript Date object or date string
    + count: a number you want to add or subtract on date
    + type: add or subtract by this time unit  
        - type list:
* Return type: string
 


### Equal
Check whether date1 equals date2 or not 
```js
var result = timeSolver.equal(date1, date2);
```
* Parameter
    + date1 and date2: standard JavaScript Date object or date string
* Return type: boolean  
    

### After
Check whether date1 after date2 or not 
```js
var result = timeSolver.after(date1, date2, type);
```
* Parameter
    + date1 and date2: standard JavaScript Date object or date string
    + type: check after by this time unit (reference type list showed before)
* Return type: boolean  


### After Today
Check whether date after today or not 
```js
var result = timeSolver.afterToday(date);
```
* Parameter
    + date: standard JavaScript Date object or date string
* Return type: boolean  


### Before
Check whether date1 before date2 or not 
```js
var result = timeSolver.before(date1, date2, type);
```
* Parameter
    + date1 and date2: standard JavaScript Date object or date string
    + type: check before by this time unit (reference type list showed before)
* Return type: boolean  


### Before Today
Check whether date before today or not 
```js
var result = timeSolver.beforeToday(date);
```
* Parameter
    + date: standard JavaScript Date object or date string
* Return type: boolean  


### Between

```js
/**
 * Count time by time unit between two date 
 * 
 * @param {date/string} [date1] standard JavaScript Date object or date string
 * @param {date/string} [date2] standard JavaScript Date object or date string
 * @param {string} [type] timeSolver time unit
 * @return {number} return count by time unit 
 */
var result = timeSolver.between(date1, date2, type);
```

[timeSolver time unit]: <https://github.com/sean1093/timeSolver#timesolver-time-unit >



### Get Date String

```js
/**
 * Get date time string by different format 
 * 
 * @param {date/string} [date] standard JavaScript Date object or date string
 * @param {string} [format] timeSolver format
 * @return {string} return formated string
 */
var dateString = timeSolver.getString(date, format);
```

* timeSolver format
    
    <table>
        <thead>
            <tr>
                <th>format</th>
            </tr>
        </thead>
        <tbody>
            <tr><td>"YYYY"</td></tr>
            <tr><td>"YYYYMM"</td></tr>
            <tr><td>"YYYYMMDD"</td></tr>
            <tr><td>"MMDDYYYY"</td></tr>
            <tr><td>"HH:MM:SS"</td></tr>
            <tr><td>"HH:MM:SSS"</td></tr>
            <tr><td>"YYYY/MM/DD"</td></tr>
            <tr><td>"YYYY/MM/DD HH:MM:SS"</td></tr>
            <tr><td>"YYYY/MM/DD HH:MM:SS.SSS"</td></tr>
            <tr><td>"YYYY-MM-DD"</td></tr>
            <tr><td>"YYYY-MM-DD HH:MM:SS"</td></tr>
            <tr><td>"YYYY-MM-DD HH:MM:SS.SSS"</td></tr>
            <tr><td>"YYYY.MM.DD"</td></tr>
            <tr><td>"YYYY.MM.DD HH:MM:SS"</td></tr>
            <tr><td>"YYYY.MM.DD HH:MM:SS.SSS"</td></tr>
            <tr><td>"MM/DD/YYYY"</td></tr>
            <tr><td>"MM/DD/YYYY HH:MM:SS"</td></tr>
            <tr><td>"MM/DD/YYYY HH:MM:SS.SSS"</td></tr>
            <tr><td>"MM-DD-YYYY"</td></tr>
            <tr><td>"MM-DD-YYYY HH:MM:SS"</td></tr>
            <tr><td>"MM-DD-YYYY HH:MM:SS.SSS"</td></tr>
            <tr><td>"MM.DD.YYYY"</td></tr>
            <tr><td>"MM.DD.YYYY HH:MM:SS"</td></tr>
            <tr><td>"MM.DD.YYYY HH:MM:SS.SSS"</td></tr>
        </tbody>
    </table>


### Get Week and Month
Get date's weekday or month name, it will return abbr. or full name by different method
```js
var result1 = timeSolver.getAbbrWeek(date);
var result2 = timeSolver.getFullWeek(date);
var result3 = timeSolver.getAbbrMonth(date);
var result4 = timeSolver.getFullMonth(date);
```
    
### isValid
return true/ false if dateString valid or not
Check whether date string is valid or not 
```js
var result = timeSolver.isValid(dateString, format);
```
* Parameter
    + dateString: date string
    + format

    <table>
        <thead>
            <tr>
                <th>format</th>
            </tr>
        </thead>
        <tbody>
            <tr><td>"YYYY/MM/DD"</td></tr>
            <tr><td>"YYYY-MM-DD"</td></tr>
            <tr><td>"YYYY.MM.DD"</td></tr>
        </tbody>
    </table>

* Return type: number


#### timeSolver time unit
    <table>
        <thead>
            <tr>
                <th>time unit</th>
                <th>parameter</th>
                <th>abbr</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Millisecond</td>
                <td>"MILLISECOND"</td>
                <td>"mill"</td>
            </tr>
            <tr>
                <td>Second</td>
                <td>"SECOND"</td>
                <td>"s"</td>
            </tr>
            <tr>
                <td>Minute</td>
                <td>"MINUTE"</td>
                <td>"min"</td>
            </tr>
            <tr>
                <td>Hour</td>
                <td>"HOUR"</td>
                <td>"h"</td>
            </tr>
            <tr>
                <td>Day</td>
                <td>"DAY"</td>
                <td>"d"</td>
            </tr>
            <tr>
                <td>Month</td>
                <td>"MONTH"</td>
                <td>"m"</td>
            </tr>
            <tr>
                <td>Year</td>
                <td>"YEAR"</td>
                <td>"y"</td>
            </tr>
        </tbody>
    </table>      


## Update log
* 1.0.7 (20170613)
    + Bug fix: YYYYMMDD: 2017613 -> 20170613
* v1.0.6 (2017/01/10) 
    + Add some new feature
    + Add minify version
* v1.0.5 (2016/08/13)
    + Module load compatibility
* v1.0.4 (2016/06/14)
    + Bug fix
* v1.0.3 (2016/04/25)
    + Restructure
* v1.0.2 Bug fix: between()
* v1.0.1 Add new function: isValid()

