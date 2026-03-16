# timeSolver.js

A small library for manipulating, validating and formatting JavaScript date object. Futhermore, it can helps you log your execution time by using [timelook].

Current Version : v1.2.0

## Getting Start


### Installation

Install via npm or download source file directly

* npm 

```sh
npm install timesolver
```

* source

https://github.com/sean1093/timeSolver/tree/master/src





### Usage

You need to use timeSolver object to manipulate JavaScript date object.



Include <code>timeSolver</code>, You can use global object in your page.

```html
<script type="text/javascript" src="timeSolver.min.js"></script>
```

You also can use via <code>require</code>.

```js
const timeSolver = require('./../timeSolver');
```

For example, if you want to get datetime string with format "YYYYMMDD", you need to do by following:

```js
const dateString = timeSolver.getString(new Date(), "YYYYMMDD");
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
const afterAdd = timeSolver.add(date, count, type);

/**
 * Subtract time by time unit
 * 
 * @param {date/string} [date] standard JavaScript Date object or date string
 * @param {string} [count] a number you want to subtract on date
 * @param {string} [type] timeSolver time unit
 * @return {date} standard JavaScript Date object
 */
const afterSubtract = timeSolver.subtract(date, count, type);
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
const result = timeSolver.equal(date1, date2);
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
const result = timeSolver.after(date1, date2, type);
```



### After Today

```js
/**
 * Check whether date after today or not 
 * 
 * @param {date/string} [date] standard JavaScript Date object or date string
 * @return {boolean} date1 after today or not  
 */
const result = timeSolver.afterToday(date);
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
const result = timeSolver.before(date1, date2, type);
```
  


### Before Today

```js
/**
 * Check whether date before today or not 
 * 
 * @param {date/string} [date] standard JavaScript Date object or date string
 * @return {boolean} date1 before today or not  
 */
const result = timeSolver.beforeToday(date);
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
const result = timeSolver.between(date1, date2, type);
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
const dateString = timeSolver.getString(date, format);
```

[timeSolver string format]



### Get Week and Month
Get date's weekday or month name, it will return abbr. or full name by different method
```js
const result1 = timeSolver.getAbbrWeek(date);
const result2 = timeSolver.getFullWeek(date);
const result3 = timeSolver.getAbbrMonth(date);
const result4 = timeSolver.getFullMonth(date);
```
    
    
### isValid

# timeSolver

timeSolver is a small, zero-dependency JavaScript utility library for manipulating,
validating and formatting Date objects. It also includes a simple timing helper
(`timeLook`) for quick performance measurements during development.

Current version: v1.2.0

--

## Installation

Install from npm:

```bash
npm install timesolver
```

Or include the bundled UMD script directly in a browser:

```html
<script src="dist/timeSolver.umd.min.js"></script>
<script>
  console.log(window.timeSolver.getString(new Date(), 'YYYYMMDD'));
</script>
```

## Usage

CommonJS:

```js
const timeSolver = require('timesolver');
```

ES Module:

```js
import timeSolver from 'timesolver';
```

Browser global:

```js
// after including dist/timeSolver.umd.min.js
timeSolver.getString(new Date(), 'YYYYMMDD');
```

## API (high level)

- `timeSolver.add(date, count, unit)` — add time to a date
- `timeSolver.subtract(date, count, unit)` — subtract time from a date
- `timeSolver.between(d1, d2, unit)` — difference between two dates in given unit
- `timeSolver.getString(date, format)` — format a date string (many formats supported)
- `timeSolver.isValid(dateString, format)` — validate a date string by supported formats
- `timeSolver.timeLookStart()`, `timeSolver.timeLook(label)`, `timeSolver.timeLookReport()` — simple timing helper

See original README for full method reference and format tables.

## Contributing

Contributions are welcome. Please open issues for bugs or feature requests and
submit pull requests with tests for new functionality.

Guidelines:

- Fork the repo and create a topic branch.
- Add tests under `test/` and ensure `npm test` passes.
- Follow existing code style and include clear commit messages.

## License

MIT — see [LICENSE](LICENSE)
            </tr>

            <tr>

                <td>Month</td>

                <td>"MONTH"</td>

