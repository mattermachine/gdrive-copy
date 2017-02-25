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
    this._MAX_RUNNING_TIME: max || 4.7 * 1000 * 60;
    this._START_TIME = this.now();
}

Timer.prototype.getMax () {
    return this._MAX_RUNNING_TIME;
}

Timer.prototype.getStart () {
    return this._START_TIME;
}

Timer.prototype.isTimeUp () {
    return (this.now() - this._START_TIME >= this._MAX_RUNNING_TIME;
}

Timer.prototype.now () {
    return (new Date()).getTime();
}

// this was from the prior 'timers' function - will probably need this in the future
this.stop = userProperties.getProperties().stop == 'true';

module.exports.Timer = Timer;