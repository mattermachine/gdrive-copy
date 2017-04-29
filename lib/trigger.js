/*****************************************
 * trigger.js
 * 
 * Trigger object contains methods to be used in creating
 * and deleting triggers for the application.
 * 
 ******************************************/

function Triggers() {
  return this;
}

/**
 * Create a trigger to run copy() in 121 seconds.
 * Save trigger ID to userProperties so it can be deleted later
 *
 */
Triggers.prototype.createTrigger = function() {
  var trigger = ScriptApp.newTrigger('copy')
    .timeBased()
    .after(6.2 * 1000 * 60) // set trigger for 6.2 minutes from now
    .create();

  if (trigger) {
    return trigger.getUniqueId();
  }
};

/**
 * Loop over all triggers
 * Delete if trigger ID matches parameter triggerId
 *
 * @param {string} triggerId unique identifier for active trigger
 */
// TODO: refactor this to 1) avoid a loop (try to map) and 2) be testable (make it so I can pass a stub?)
Triggers.prototype.deleteTrigger = function(triggerId) {
  if (triggerId !== undefined && triggerId !== null) {
    try {
      // Loop over all triggers.
      var allTriggers = ScriptApp.getProjectTriggers();
      for (var i = 0; i < allTriggers.length; i++) {
        // If the current trigger is the correct one, delete it.
        if (allTriggers[i].getUniqueId() == triggerId) {
          ScriptApp.deleteTrigger(allTriggers[i]);
          break;
        }
      }
    } catch (err) {
      log([err.message, err.fileName, err.lineNumber]);
    }
  }
};
