/**
 * timeSolver.js
 *
 * @description A small date time tool in JavaScript, see: https://github.com/sean1093/timeSolver/ for details
 * @version v1.2.0
 * @author Sean Chou
 * @license [https://github.com/sean1093/timeSolver/blob/master/LICENSE] [Licensed under MIT]
 */

const _timeSolver = (function () {
    'use strict';

    // ============================================================================
    // Constants
    // ============================================================================

    /**
     * Time unit constants
     */
    const UNITS = {
        MILLISECOND: 0,
        SECOND: 1,
        MINUTE: 2,
        HOUR: 3,
        DAY: 4,
        MONTH: 5,
        YEAR: 6
    };

    /**
     * Milliseconds conversion factors for each time unit
     */
    const MILLISECONDS_PER_UNIT = {
        [UNITS.MILLISECOND]: 1,
        [UNITS.SECOND]: 1000,
        [UNITS.MINUTE]: 60000,
        [UNITS.HOUR]: 3600000,
        [UNITS.DAY]: 86400000,
        [UNITS.MONTH]: 2629800000,    // Average month (30.44 days)
        [UNITS.YEAR]: 31557600000      // Average year (365.25 days)
    };

    /**
     * Month names in English
     */
    const MONTH_NAMES = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    /**
     * Weekday names in English
     */
    const WEEKDAY_NAMES = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];

    /**
     * Regular expressions for date format validation
     */
    const DATE_VALIDATION_PATTERNS = {
        YYYY_SLASH_MM_DD: /^(\d{4})([/])((1|3|5|7|8|0[13578]|1[02])\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])|(4|6|9|0[469]|11)\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[0])|(02|2)\2([1-9]|0[1-9]|1[0-9]|2[0-8]))$/,
        YYYY_DASH_MM_DD: /^(\d{4})([-])((1|3|5|7|8|0[13578]|1[02])\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])|(4|6|9|0[469]|11)\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[0])|(02|2)\2([1-9]|0[1-9]|1[0-9]|2[0-8]))$/,
        YYYY_DOT_MM_DD: /^(\d{4})([.])((1|3|5|7|8|0[13578]|1[02])\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])|(4|6|9|0[469]|11)\2([1-9]|0[1-9]|1[0-9]|2[0-9]|3[0])|(02|2)\2([1-9]|0[1-9]|1[0-9]|2[0-8]))$/,
        DD_SLASH_MM_YYYY: /^([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])([/])((1|3|5|7|8|0[13578]|1[02])\2(\d{4})|(4|6|9|0[469]|11)\2(\d{4})|(02|2)\2(\d{4}))$/,
        DD_DASH_MM_YYYY: /^([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])([-])((1|3|5|7|8|0[13578]|1[02])\2(\d{4})|(4|6|9|0[469]|11)\2(\d{4})|(02|2)\2(\d{4}))$/,
        DD_DOT_MM_YYYY: /^([1-9]|0[1-9]|1[0-9]|2[0-9]|3[01])([.])((1|3|5|7|8|0[13578]|1[02])\2(\d{4})|(4|6|9|0[469]|11)\2(\d{4})|(02|2)\2(\d{4}))$/,
        TIME: /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/
    };

    /**
     * Format string to index mapping
     */
    const FORMAT_INDEX = {
        'YYYY': 0,
        'YYYYMM': 1,
        'YYYYMMDD': 2,
        'YYYY/MM/DD': 3,
        'YYYY-MM-DD': 4,
        'YYYY.MM.DD': 5,
        'MMDDYYYY': 6,
        'DDMMYYYY': 7,
        'MM/DD/YYYY': 8,
        'MM-DD-YYYY': 9,
        'MM.DD.YYYY': 10,
        'YYYY/MM/DD HH:MM:SS': 11,
        'YYYY/MM/DD HH:MM:SS.SSS': 12,
        'YYYY-MM-DD HH:MM:SS': 13,
        'YYYY-MM-DD HH:MM:SS.SSS': 14,
        'YYYY.MM.DD HH:MM:SS': 15,
        'YYYY.MM.DD HH:MM:SS.SSS': 16,
        'YYYYMMDD HH:MM:SS': 17,
        'YYYYMMDD HH:MM:SS.SSS': 18,
        'MM/DD/YYYY HH:MM:SS': 19,
        'MM/DD/YYYY HH:MM:SS.SSS': 20,
        'MM-DD-YYYY HH:MM:SS': 21,
        'MM-DD-YYYY HH:MM:SS.SSS': 22,
        'MM.DD.YYYY HH:MM:SS': 23,
        'MM.DD.YYYY HH:MM:SS.SSS': 24,
        'HH:MM:SS': 25,
        'HH:MM:SS.SSS': 26,
        'DD/MM/YYYY': 27,
        'DD-MM-YYYY': 28,
        'DD.MM.YYYY': 29,
        'DD/MM/YYYY HH:MM:SS': 30,
        'DD/MM/YYYY HH:MM:SS.SSS': 31,
        'DD-MM-YYYY HH:MM:SS': 32,
        'DD-MM-YYYY HH:MM:SS.SSS': 33,
        'DD.MM.YYYY HH:MM:SS': 34,
        'DD.MM.YYYY HH:MM:SS.SSS': 35
    };

    /**
     * Error messages
     */
    const ERROR_MESSAGES = {
        INVALID_TYPE: '[timeSolver] Input Type Error',
        INVALID_DATE: '[timeSolver] Invalid Date'
    };

    /**
     * Default format for getString
     */
    const DEFAULT_DATE_FORMAT = 'YYYYMMDD';

    /**
     * Console styles for timeLook report
     */
    const CONSOLE_STYLES = {
        TITLE: 'font-weight: bold; color: #3F51B5',
        REPORT: 'color: #2962FF',
        INFO: 'color: #4CAF50',
        MAX: 'color: #ff0000'
    };

    // ============================================================================
    // Helper Functions
    // ============================================================================

    /**
     * Pad a number with leading zeros
     * @param {number} value - The value to pad
     * @param {number} width - The desired width (default: 2)
     * @returns {string} The padded string
     */
    function padZero(value, width) {
        width = width || 2;
        var s = String(value);
        while (s.length < width) {
            s = '0' + s;
        }
        return s;
    }

    /**
     * Parse input to a valid Date object
     * @param {Date|string|number} input - Input to parse
     * @returns {Date|null} Parsed Date object or null if invalid
     */
    function parseDate(input) {
        var date = (input instanceof Date) ? input : new Date(input);
        if (isNaN(date.getTime())) {
            console.error(ERROR_MESSAGES.INVALID_DATE);
            return null;
        }
        return date;
    }

    /**
     * Convert unit string to unit index
     * @param {string|undefined} unit - Unit string (e.g., 'D', 'HOUR')
     * @returns {number} Unit index
     */
    function unitToIndex(unit) {
        if (unit === undefined) {
            return UNITS.MILLISECOND;
        }

        var normalizedUnit = String(unit).toUpperCase();

        if (normalizedUnit === 'MILLISECOND' || normalizedUnit === 'MILL') return UNITS.MILLISECOND;
        if (normalizedUnit === 'SECOND' || normalizedUnit === 'S') return UNITS.SECOND;
        if (normalizedUnit === 'MINUTE' || normalizedUnit === 'MIN') return UNITS.MINUTE;
        if (normalizedUnit === 'HOUR' || normalizedUnit === 'H') return UNITS.HOUR;
        if (normalizedUnit === 'DAY' || normalizedUnit === 'D') return UNITS.DAY;
        if (normalizedUnit === 'MONTH' || normalizedUnit === 'M') return UNITS.MONTH;
        if (normalizedUnit === 'YEAR' || normalizedUnit === 'Y') return UNITS.YEAR;

        return normalizedUnit;
    }

    /**
     * Add or subtract time from a date
     * @param {Date} date - The date to modify
     * @param {number} count - Amount to add/subtract
     * @param {number} unitIndex - Unit index
     * @param {number} multiplier - 1 for add, -1 for subtract
     * @returns {Date|null} Modified date
     */
    function modifyDate(date, count, unitIndex, multiplier) {
        if (!date) return null;

        count = (count === undefined) ? 0 : count * multiplier;

        switch(unitIndex) {
            case UNITS.MILLISECOND:
                return new Date(date.setMilliseconds(date.getMilliseconds() + count));
            case UNITS.SECOND:
                return new Date(date.setSeconds(date.getSeconds() + count));
            case UNITS.MINUTE:
                return new Date(date.setMinutes(date.getMinutes() + count));
            case UNITS.HOUR:
                return new Date(date.setHours(date.getHours() + count));
            case UNITS.DAY:
                return new Date(date.setDate(date.getDate() + count));
            case UNITS.MONTH:
                return new Date(date.setMonth(date.getMonth() + count));
            case UNITS.YEAR:
                return new Date(date.setFullYear(date.getFullYear() + count));
            default:
                console.error(ERROR_MESSAGES.INVALID_TYPE);
                return null;
        }
    }

    /**
     * Build a formatted date string
     * @param {Date} date - The date object
     * @param {number} formatIndex - The format index
     * @returns {string} Formatted date string
     */
    function buildDateString(date, formatIndex) {
        var year = date.getFullYear();
        var month = padZero(date.getMonth() + 1);
        var day = padZero(date.getDate());
        var hour = padZero(date.getHours());
        var minute = padZero(date.getMinutes());
        var second = padZero(date.getSeconds());
        var millisecond = padZero(date.getMilliseconds(), 3);

        var YYYY = year.toString();
        var MM = month.toString();
        var DD = day.toString();
        var YYYYMMDD = YYYY + MM + DD;
        var HHMMSS = hour + ':' + minute + ':' + second;
        var HHMMSSS = HHMMSS + '.' + millisecond;

        var formatMap = {
            0: YYYY,
            1: YYYY + MM,
            2: YYYYMMDD,
            3: YYYY + '/' + MM + '/' + DD,
            4: YYYY + '-' + MM + '-' + DD,
            5: YYYY + '.' + MM + '.' + DD,
            6: MM + DD + YYYY,
            7: DD + MM + YYYY,
            8: MM + '/' + DD + '/' + YYYY,
            9: MM + '-' + DD + '-' + YYYY,
            10: MM + '.' + DD + '.' + YYYY,
            11: YYYY + '/' + MM + '/' + DD + ' ' + HHMMSS,
            12: YYYY + '/' + MM + '/' + DD + ' ' + HHMMSSS,
            13: YYYY + '-' + MM + '-' + DD + ' ' + HHMMSS,
            14: YYYY + '-' + MM + '-' + DD + ' ' + HHMMSSS,
            15: YYYY + '.' + MM + '.' + DD + ' ' + HHMMSS,
            16: YYYY + '.' + MM + '.' + DD + ' ' + HHMMSSS,
            17: YYYYMMDD + ' ' + HHMMSS,
            18: YYYYMMDD + ' ' + HHMMSSS,
            19: MM + '/' + DD + '/' + YYYY + ' ' + HHMMSS,
            20: MM + '/' + DD + '/' + YYYY + ' ' + HHMMSSS,
            21: MM + '-' + DD + '-' + YYYY + ' ' + HHMMSS,
            22: MM + '-' + DD + '-' + YYYY + ' ' + HHMMSSS,
            23: MM + '.' + DD + '.' + YYYY + ' ' + HHMMSS,
            24: MM + '.' + DD + '.' + YYYY + ' ' + HHMMSSS,
            25: HHMMSS,
            26: HHMMSSS,
            27: DD + '/' + MM + '/' + YYYY,
            28: DD + '-' + MM + '-' + YYYY,
            29: DD + '.' + MM + '.' + YYYY,
            30: DD + '/' + MM + '/' + YYYY + ' ' + HHMMSS,
            31: DD + '/' + MM + '/' + YYYY + ' ' + HHMMSSS,
            32: DD + '-' + MM + '-' + YYYY + ' ' + HHMMSS,
            33: DD + '-' + MM + '-' + YYYY + ' ' + HHMMSSS,
            34: DD + '.' + MM + '.' + YYYY + ' ' + HHMMSS,
            35: DD + '.' + MM + '.' + YYYY + ' ' + HHMMSSS
        };

        return formatMap[formatIndex];
    }

    /**
     * Validate date string against specific format
     * @param {string} dateString - The date string to validate
     * @param {number} formatIndex - The format index
     * @returns {boolean} True if valid, false otherwise
     */
    function validateDateFormat(dateString, formatIndex) {
        var parts;

        switch(formatIndex) {
            case FORMAT_INDEX['YYYY/MM/DD']:
                return DATE_VALIDATION_PATTERNS.YYYY_SLASH_MM_DD.test(dateString);

            case FORMAT_INDEX['YYYY-MM-DD']:
                return DATE_VALIDATION_PATTERNS.YYYY_DASH_MM_DD.test(dateString);

            case FORMAT_INDEX['YYYY.MM.DD']:
                return DATE_VALIDATION_PATTERNS.YYYY_DOT_MM_DD.test(dateString);

            case FORMAT_INDEX['YYYY/MM/DD HH:MM:SS']:
                parts = dateString.split(' ');
                return parts.length >= 2 &&
                       DATE_VALIDATION_PATTERNS.YYYY_SLASH_MM_DD.test(parts[0]) &&
                       DATE_VALIDATION_PATTERNS.TIME.test(parts[1]);

            case FORMAT_INDEX['YYYY-MM-DD HH:MM:SS']:
                parts = dateString.split(' ');
                return parts.length >= 2 &&
                       DATE_VALIDATION_PATTERNS.YYYY_DASH_MM_DD.test(parts[0]) &&
                       DATE_VALIDATION_PATTERNS.TIME.test(parts[1]);

            case FORMAT_INDEX['YYYY.MM.DD HH:MM:SS']:
                parts = dateString.split(' ');
                return parts.length >= 2 &&
                       DATE_VALIDATION_PATTERNS.YYYY_DOT_MM_DD.test(parts[0]) &&
                       DATE_VALIDATION_PATTERNS.TIME.test(parts[1]);

            case FORMAT_INDEX['HH:MM:SS']:
                parts = dateString.split(' ');
                return parts.length >= 2 && DATE_VALIDATION_PATTERNS.TIME.test(parts[1]);

            case FORMAT_INDEX['DD/MM/YYYY']:
                return DATE_VALIDATION_PATTERNS.DD_SLASH_MM_YYYY.test(dateString);

            case FORMAT_INDEX['DD-MM-YYYY']:
                return DATE_VALIDATION_PATTERNS.DD_DASH_MM_YYYY.test(dateString);

            case FORMAT_INDEX['DD.MM.YYYY']:
                return DATE_VALIDATION_PATTERNS.DD_DOT_MM_YYYY.test(dateString);

            case FORMAT_INDEX['DD/MM/YYYY HH:MM:SS']:
                parts = dateString.split(' ');
                return parts.length >= 2 &&
                       DATE_VALIDATION_PATTERNS.DD_SLASH_MM_YYYY.test(parts[0]) &&
                       DATE_VALIDATION_PATTERNS.TIME.test(parts[1]);

            case FORMAT_INDEX['DD-MM-YYYY HH:MM:SS']:
                parts = dateString.split(' ');
                return parts.length >= 2 &&
                       DATE_VALIDATION_PATTERNS.DD_DASH_MM_YYYY.test(parts[0]) &&
                       DATE_VALIDATION_PATTERNS.TIME.test(parts[1]);

            case FORMAT_INDEX['DD.MM.YYYY HH:MM:SS']:
                parts = dateString.split(' ');
                return parts.length >= 2 &&
                       DATE_VALIDATION_PATTERNS.DD_DOT_MM_YYYY.test(parts[0]) &&
                       DATE_VALIDATION_PATTERNS.TIME.test(parts[1]);

            default:
                console.error(ERROR_MESSAGES.INVALID_TYPE);
                return null;
        }
    }

    // ============================================================================
    // Public API
    // ============================================================================

    var timeSolver = {
        /**
         * Add time to a date
         * @param {Date|string} date - The date
         * @param {number} count - Amount to add
         * @param {string} unit - Time unit
         * @returns {Date|null} New date with time added
         */
        add: function(date, count, unit) {
            var unitIndex = unitToIndex(unit);
            var parsedDate = parseDate(date);
            return modifyDate(parsedDate, count, unitIndex, 1);
        },

        /**
         * Subtract time from a date
         * @param {Date|string} date - The date
         * @param {number} count - Amount to subtract
         * @param {string} unit - Time unit
         * @returns {Date|null} New date with time subtracted
         */
        subtract: function(date, count, unit) {
            var unitIndex = unitToIndex(unit);
            var parsedDate = parseDate(date);
            return modifyDate(parsedDate, count, unitIndex, -1);
        },

        /**
         * Check if two dates are equal
         * @param {Date|string} date1 - First date
         * @param {Date|string} date2 - Second date
         * @returns {boolean} True if dates are equal
         */
        equal: function(date1, date2) {
            var d1 = parseDate(date1);
            var d2 = parseDate(date2);
            return d1.toString() === d2.toString();
        },

        /**
         * Calculate time difference between two dates
         * @param {Date|string} date1 - Start date
         * @param {Date|string} date2 - End date
         * @param {string} unit - Unit to return difference in
         * @returns {number} Time difference
         */
        between: function(date1, date2, unit) {
            var unitIndex = unitToIndex(unit);
            var d1 = parseDate(date1);
            var d2 = parseDate(date2);
            var timeDiff = d2.getTime() - d1.getTime();
            var divisor = MILLISECONDS_PER_UNIT[unitIndex];

            if (!divisor) {
                console.error(ERROR_MESSAGES.INVALID_TYPE);
                return 0;
            }

            return timeDiff / divisor;
        },

        /**
         * Check if date1 is after date2
         * @param {Date|string} date1 - First date
         * @param {Date|string} date2 - Second date
         * @param {string} unit - Unit for comparison
         * @returns {boolean} True if date1 is after date2
         */
        after: function(date1, date2, unit) {
            return this.between(date1, date2, unit) < 0;
        },

        /**
         * Check if date is after today
         * @param {Date|string} date - The date to check
         * @returns {boolean} True if date is after today
         */
        afterToday: function(date) {
            return this.after(date, new Date(), 'D');
        },

        /**
         * Check if date1 is before date2
         * @param {Date|string} date1 - First date
         * @param {Date|string} date2 - Second date
         * @param {string} unit - Unit for comparison
         * @returns {boolean} True if date1 is before date2
         */
        before: function(date1, date2, unit) {
            return this.between(date1, date2, unit) > 0;
        },

        /**
         * Check if date is before today
         * @param {Date|string} date - The date to check
         * @returns {boolean} True if date is before today
         */
        beforeToday: function(date) {
            return this.before(date, new Date(), 'D');
        },

        /**
         * Get formatted date string
         * @param {Date|string} date - The date
         * @param {string} format - Format string (e.g., 'YYYY-MM-DD')
         * @returns {string} Formatted date string
         */
        getString: function(date, format) {
            format = (format === undefined) ? DEFAULT_DATE_FORMAT : format.toUpperCase();
            var parsedDate = parseDate(date);
            var formatIndex = FORMAT_INDEX[format];

            if (formatIndex === undefined) {
                return ERROR_MESSAGES.INVALID_TYPE;
            }

            var result = buildDateString(parsedDate, formatIndex);
            return result || ERROR_MESSAGES.INVALID_TYPE;
        },

        /**
         * Get abbreviated weekday name
         * @param {Date|string} date - The date
         * @returns {string|Error} Abbreviated weekday name or Error
         */
        getAbbrWeek: function(date) {
            var parsedDate = parseDate(date);
            return parsedDate !== null ?
                   parsedDate.toString().substring(0, 3) :
                   new Error(ERROR_MESSAGES.INVALID_DATE);
        },

        /**
         * Get full weekday name
         * @param {Date|string} date - The date
         * @returns {string} Full weekday name
         */
        getFullWeek: function(date) {
            var parsedDate = parseDate(date);
            return WEEKDAY_NAMES[parsedDate.getDay()];
        },

        /**
         * Get abbreviated month name
         * @param {Date|string} date - The date
         * @returns {string|Error} Abbreviated month name or Error
         */
        getAbbrMonth: function(date) {
            var parsedDate = parseDate(date);
            return parsedDate !== null ?
                   parsedDate.toString().substring(4, 7) :
                   new Error(ERROR_MESSAGES.INVALID_DATE);
        },

        /**
         * Get full month name
         * @param {Date|string} date - The date
         * @returns {string} Full month name
         */
        getFullMonth: function(date) {
            var parsedDate = parseDate(date);
            return MONTH_NAMES[parsedDate.getMonth()];
        },

        /**
         * Validate date string
         * @param {string} dateString - The date string to validate
         * @param {string} format - Expected format (optional)
         * @returns {boolean|null} True if valid, false if invalid, null on error
         */
        isValid: function(dateString, format) {
            if (format === undefined) {
                return !isNaN(new Date(dateString).getTime());
            }

            var normalizedFormat = format.toUpperCase();
            var formatIndex = FORMAT_INDEX[normalizedFormat];

            if (formatIndex === undefined) {
                console.error(ERROR_MESSAGES.INVALID_TYPE);
                return null;
            }

            return validateDateFormat(dateString, formatIndex);
        },

        /**
         * Get quarter by month number
         * @param {number} month - Month number (1-12)
         * @returns {number|null} Quarter number (1-4) or null
         */
        getQuarterByMonth: function(month) {
            if (month >= 1 && month <= 3) return 1;
            if (month >= 4 && month <= 6) return 2;
            if (month >= 7 && month <= 9) return 3;
            if (month >= 10 && month <= 12) return 4;
            return null;
        },

        /**
         * Get first month of quarter
         * @param {number} quarter - Quarter number (1-4)
         * @returns {number|null} First month of quarter or null
         */
        getFirstMonthByQuarter: function(quarter) {
            var quarterToMonth = {
                1: 1,
                2: 4,
                3: 7,
                4: 10
            };
            return quarterToMonth[quarter] || null;
        },

        // ========================================================================
        // TimeLook - Performance Profiling
        // ========================================================================

        timeArray: [],
        timeLookMax: 0,
        timeLookTotal: 0,

        /**
         * Start time profiling
         */
        timeLookStart: function() {
            this.timeArray = [];
            this.timeLookMax = 0;
            this.timeLookTotal = 0;
            this.timeArray.push({
                label: 'start',
                time: new Date(),
                interval: 0
            });
        },

        /**
         * Mark a time checkpoint
         * @param {string} label - Label for this checkpoint
         */
        timeLook: function(label) {
            var last = this.timeArray[this.timeArray.length - 1];
            var now = new Date();
            var interval = this.between(last.time, now, 'S');

            this.timeLookTotal += interval;
            this.timeLookMax = Math.max(interval, this.timeLookMax);

            this.timeArray.push({
                label: label,
                time: now,
                interval: interval
            });
        },

        /**
         * Print time profiling report to console
         */
        timeLookReport: function() {
            var reportStart = new Date();

            console.log('%c=================================', CONSOLE_STYLES.REPORT);
            console.log('%c[timeSolver] Time Look Report', CONSOLE_STYLES.TITLE);

            for (var i = 1; i < this.timeArray.length; i++) {
                var entry = this.timeArray[i];
                var percentage = Math.round((entry.interval / this.timeLookTotal) * 100);
                var style = (this.timeLookMax === entry.interval) ? CONSOLE_STYLES.MAX : CONSOLE_STYLES.REPORT;

                console.log(
                    '%c[' + entry.interval + 's] ' + percentage + '%  ' + entry.label,
                    style
                );
            }

            var reportEnd = new Date();
            var reportTime = this.between(reportStart, reportEnd, 'S');

            console.log(
                '%c[timeSolver] Spend ' + reportTime + 's to create this report',
                CONSOLE_STYLES.INFO
            );
            console.log(
                '%c[timeSolver] For more information: https://github.com/sean1093/timeSolver#timelook',
                CONSOLE_STYLES.INFO
            );
            console.log('%c=================================', CONSOLE_STYLES.REPORT);
        }
    };

    return timeSolver;
})();

// Module exports
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = _timeSolver;
} else if (typeof window !== 'undefined') {
    window.timeSolver = _timeSolver;
}
