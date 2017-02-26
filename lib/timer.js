/*****************************************
 * timer.js
 * 
 * Timer object contains methods and properties to control
 * the timing of the application in regards to the maximum
 * timeout quota.
 * 
 ******************************************/

function Timer (max) {
    // optionally pass a max parameter, for testing purposes
    this._MAX_RUNNING_TIME = max || 4.7 * 1000 * 60;
    this._START_TIME = this.now();

    return this;
}

Timer.prototype.getMax = function () {
    return this._MAX_RUNNING_TIME;
}

Timer.prototype.getStart = function () {
    return this._START_TIME;
}

Timer.prototype.isTimeUp = function () {
    return this.now() - this._START_TIME >= this._MAX_RUNNING_TIME;
}

Timer.prototype.now = function () {
    return (new Date()).getTime();
}

// this was from the prior 'timers' function - will probably need this in the future
// this.stop = userProperties.getProperties().stop == 'true';

module.exports.Timer = Timer;