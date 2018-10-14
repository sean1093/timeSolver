/**
 * timeSolver.timeLook.js
 * 
 * @description A small date time tool in JavaScript, see: https://github.com/sean1093/timeSolver/ for details
 * @version v0.0.1 
 * @author Sean Chou
 * @license [https://github.com/sean1093/timeSolver/blob/master/LICENSE] [Licensed under MIT]
 */

(function () {
    'use strict';
 
    //public 
    var timeLook = {
        timeArray: [],
        timeLookMax: 0,
        timeLookTotal: 0,
        timeLookStart: function() {
            this.timeArray.length = 0;
            this.timeLookMax = 0;
            this.timeLookTotal = 0;
            this.timeArray.push({label: 'start', time: new Date(), interval: 0});
        },
        timeLook: function(label) {
            var last = this.timeArray[this.timeArray.length-1];
            var now = new Date();
            var interval = timeSolver.between(last.time, now, 'S');
            this.timeLookTotal += interval;
            this.timeLookMax = interval > this.timeLookMax ? interval : this.timeLookMax;
            this.timeArray.push({label: label, time: new Date(), interval: interval});
        },
        timeLookReport: function() {
            var titleStyle = 'font-weight: bold; color: #3F51B5';
            var reportStyle = 'color: #2962FF';
            var infoStyle = 'color: #4CAF50';
            var maxStyle = 'color: #ff0000';
            var now = new Date();
            console.log('%c=================================', reportStyle);
            console.log('%c[timeSolver] Time Look Report', titleStyle);
            for(var i = 1; i < timeLook.timeArray.length; i++) {
                var label = timeLook.timeArray[i].label;
                var interval = timeLook.timeArray[i].interval;
                var style = this.timeLookMax == interval ? maxStyle : reportStyle;
                console.log('%c['+ interval +'s] '+Math.round((interval/this.timeLookTotal)*100) +'%  '+label , style);
            }
            var end = new Date();
            console.log('%c[timeSolver] Spend '+timeSolver.between(now, end, 'S')+'s to create this report', infoStyle);
            console.log('%c[timeSolver] For more information: https://github.com/sean1093/timeSolver#timelook', infoStyle);
            console.log('%c=================================', reportStyle);
        }
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
        module.exports = timeLook;
    else
        window.timeLook = timeLook;
})();
