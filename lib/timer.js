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
    this._START_TIME = this._getTime();
    // TODO: add documentation to the app regarding the timezone
    this._timezone = 'GMT';

    return this;
}

Timer.prototype.getMax = function () {
    return this._MAX_RUNNING_TIME;
};

Timer.prototype.getStart = function () {
    return this._START_TIME;
};

Timer.prototype.isTimeUp = function () {
    return this._getTime() - this._START_TIME >= this._MAX_RUNNING_TIME;
};

Timer.prototype.isStopped = function () {
    return PropertiesService.getUserProperties().getProperty('stop') === 'true';
};

Timer.prototype.today = function () {
    return Utilities.formatDate(new Date(), this.getTimezone(), "MM-dd-yyyy");
};

Timer.prototype.now = function () {
    // TODO: figure out how to get the user's timezone for real
    return Utilities.formatDate(new Date(), this.getTimezone(), "MM-dd-yy hh:mm:ss aaa");
};

Timer.prototype.canContinue = function () {
    return !this.isTimeUp() && !this.isStopped();
};

Timer.prototype._getTime = function () {
    return (new Date()).getTime();
}

Timer.prototype.setTimezone = function (timezone) {
    if (!(timezone === undefined || timezone === null)) {
        this._timezone = timezone;
    }
};

Timer.prototype.getTimezone = function () {
    return this._timezone || 'GMT';
};

if (module && module.exports) {
    module.exports['Timer'] = Timer;
}
