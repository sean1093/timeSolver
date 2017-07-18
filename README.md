# timeSolver.js

A small library for manipulating, validating and formatting JavaScript date object. Futhermore, it can helps you log your execution time by using [timelook].


#### Current Version : v1.1.1 


## Getting Start

Include <code>timeSolver</code> in your HTML page. 
```html
<script type="text/javascript" src="http://sean1093.github.io/lib/js/timeSolver/1.1.1/timeSolver.min.js"></script>
```

You need to use timeSolver object to manipulate JavaScript date object.
For example, if you want to get datetime string with format "YYYYMMDD", you need to do by following:
```js
let dateString = timeSolver.getString(new Date(), "YYYYMMDD");
```

## Method 

### Add and Subtract
You can use this basic manipulate on date, add or subtract, by different time unit(type)
```js
/**
 * Add time by time unit
 * 
 * @param {date/string} [date] standard JavaScript Date object or date string
 * @param {string} [count] a number you want to add on date
 * @param {string} [type] timeSolver time unit
 * @return {date} standard JavaScript Date object
 */
let afterAdd = timeSolver.add(date, count, type);

/**
 * Subtract time by time unit
 * 
 * @param {date/string} [date] standard JavaScript Date object or date string
 * @param {string} [count] a number you want to subtract on date
 * @param {string} [type] timeSolver time unit
 * @return {date} standard JavaScript Date object
 */
let afterSubtract = timeSolver.subtract(date, count, type);
```

[timeSolver time unit]



### Equal

```js
/**
 * Check whether two dates equals or not 
 * 
 * @param {date/string} [date1] standard JavaScript Date object or date string
 * @param {date/string} [date2] standard JavaScript Date object or date string
 * @return {boolean} equals or not  
 */
let result = timeSolver.equal(date1, date2);
```


### After

```js
/**
 * Check whether date1 after date2 or not 
 * 
 * @param {date/string} [date1] standard JavaScript Date object or date string
 * @param {date/string} [date2] standard JavaScript Date object or date string
 * @return {boolean} date1 after date2 or not  
 */
let result = timeSolver.after(date1, date2, type);
```



### After Today

```js
/**
 * Check whether date after today or not 
 * 
 * @param {date/string} [date] standard JavaScript Date object or date string
 * @return {boolean} date1 after today or not  
 */
let result = timeSolver.afterToday(date);
```



### Before

```js
/**
 * Check whether date1 before date2 or not 
 * 
 * @param {date/string} [date1] standard JavaScript Date object or date string
 * @param {date/string} [date2] standard JavaScript Date object or date string
 * @return {boolean} date1 before date2 or not  
 */
let result = timeSolver.before(date1, date2, type);
```
  


### Before Today

```js
/**
 * Check whether date before today or not 
 * 
 * @param {date/string} [date] standard JavaScript Date object or date string
 * @return {boolean} date1 before today or not  
 */
let result = timeSolver.beforeToday(date);
```



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
let result = timeSolver.between(date1, date2, type);
```

[timeSolver time unit]





### Get Date String

```js
/**
 * Get date time string by different format 
 * 
 * @param {date/string} [date] standard JavaScript Date object or date string
 * @param {string} [format] timeSolver string format
 * @return {string} return formated string
 */
let dateString = timeSolver.getString(date, format);
```

[timeSolver string format]



### Get Week and Month
Get date's weekday or month name, it will return abbr. or full name by different method
```js
let result1 = timeSolver.getAbbrWeek(date);
let result2 = timeSolver.getFullWeek(date);
let result3 = timeSolver.getAbbrMonth(date);
let result4 = timeSolver.getFullMonth(date);
```
    
    
### isValid

```js
/**
 * Check whether date string is valid or not and return true/ false if dateString valid or not 
 * 
 * @param {string} [dateString] date string
 * @param {string} [format] timeSolver valid format
 * @return {boolean} dateString is valid or not
 */
let result = timeSolver.isValid(dateString, format);
```

[timeSolver valid format]



#### timeSolver time unit
* 
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


#### timeSolver string format

*     
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


#### timeSolver valid format
* 
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
            <tr><td>"YYYY/MM/DD HH:MM:SS"</td></tr>
            <tr><td>"YYYY-MM-DD HH:MM:SS"</td></tr>
            <tr><td>"YYYY.MM.DD HH:MM:SS"</td></tr>
        </tbody>
    </table>




## timeLook
It can helps you log your execution time by using timeLook

1. start timeLook
```js
timeSolver.timeLookStart();
```

2. set your break point with label text
```js
timeSolver.timeLook("test");
...
timeSolver.timeLook("date basic function");
...
...

```

3. see your time log report 
```js
timeSolver.timeLookReport();
```

For example, it will print on your browser console. 

![timeLook](https://github.com/sean1093/timeSolver/blob/master/img/timeLook.png "timeLook")

It will shows every execution time between your two break point, and mark the bottleneck with red color(Chrome Console). 





### Update log

* 1.1.1 (20170718)
    + Enhance function: isValid(), add three timestamp format
* 1.1.0 (20170614)
    + New feature: timeLook, helps you log your execution time
* 1.0.7 (20170613)
    + Bug fix: YYYYMMDD: 2017613 -> 20170613
* 1.0.6 (20170110) 
    + Add some new feature
    + Add minify version
* 1.0.5 (20160813)
    + Module load compatibility
* 1.0.4 (20160614)
    + Bug fix
* 1.0.3 (20160425)
    + Restructure
* 1.0.2 
    + Bug fix: between()
* 1.0.1 
    + Add new function: isValid()


[timelook]: <https://github.com/sean1093/timeSolver#timelook>

[timeSolver time unit]: <https://github.com/sean1093/timeSolver#timesolver-time-unit>

[timeSolver string format]: <https://github.com/sean1093/timeSolver#timesolver-string-format>

[timeSolver valid format]: <https://github.com/sean1093/timeSolver#timesolver-valid-format>




