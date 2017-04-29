var assert = require('chai').assert;
var Timer = require('../lib/timer.js').Timer;

describe('Timer', function() {
  it('should set _MAX_RUNNING_TIME to the `max` paramters', function() {
    var timer = new Timer(300);
    assert.equal(timer.getMax(), 300);
  });

  it('should have a default _MAX_RUNNING_TIME of 4.7 minutes', function() {
    var timer = new Timer();
    var time = 4.7 * 1000 * 60;
    assert.equal(timer.getMax(), time);
  });

  it('should return true with max time is reached', function(done) {
    var timer = new Timer(200);
    setTimeout(function() {
      assert.equal(timer.isTimeUp(), true);
      done();
    }, 300);
  });

  it('should return false if max time is not reached', function(done) {
    var timer = new Timer(3000);
    setTimeout(function() {
      assert.equal(timer.isTimeUp(), false);
      done();
    }, 100);
  });

  it('should default to "GMT" timezone', function() {
    assert.equal(Timer.prototype.getTimezone(), 'GMT');
    Timer.prototype.setTimezone('GMT-7');
    assert.equal(Timer.prototype.getTimezone(), 'GMT-7');
    var timer = new Timer();
    assert.equal(timer.getTimezone(), 'GMT');
  });
});
