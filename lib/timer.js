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
    this._START_TIME = getTime();

    return this;
}

Timer.prototype.getMax = function () {
    return this._MAX_RUNNING_TIME;
};

Timer.prototype.getStart = function () {
    return this._START_TIME;
};

Timer.prototype.isTimeUp = function () {
    return getTime() - this._START_TIME >= this._MAX_RUNNING_TIME;
};

Timer.prototype.isStopped = function () {
    return PropertiesService.getUserProperties().getProperty('stop') === 'true';
};

Timer.prototype.today = function () {
    return Utilities.formatDate(new Date(), "GMT-5", "MM-dd-yyyy");
};

Timer.prototype.now = function () {
    return Utilities.formatDate(new Date(), Properties.prototype.getTimeZone(), "MM-dd-yy hh:mm:ss aaa");
};

Timer.prototype.canContinue = function () {
    return !this.isTimeUp() && !this.isStopped();
};

function getTime () {
    return (new Date()).getTime();
}

module.exports.Timer = Timer;