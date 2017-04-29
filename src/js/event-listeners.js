/**
 * This module provides functions that add event listeners
 * to all parts of the application.
 * 
 * Individual functions are commented to provide context for 
 * their usage.
 */

var DOM = require('./DOM');
var picker = require('./picker');
var parseId = require('./parseId');
var textboxHandlers = require('./textbox-handlers');

module.exports = {
  /**
     * Set bindings for selectFolder and selectOtherFolder buttons.
     * Used in both addResumeformListeners and addStartFormListeners
     */
  addSelectButtonListeners: function() {
    $('.selectOtherFolder').click(function() {
      DOM.resetForm();
    });

    // Show Google Picker when select Folder buttons are selected
    $('.selectFolderButton').click(function() {
      picker.showPicker();
    });
  },

  /**
     * Set bindings for input elements in the Resume view
     */
  addResumeFormListeners: function() {
    var resumeTextbox = document.getElementById('resumeTextbox');
    resumeTextbox.addEventListener(
      'mouseup',
      textboxHandlers.handleMouse,
      false
    );
    resumeTextbox.addEventListener('keyup', textboxHandlers.getFileData, false);

    /**
         * Execute when resuming folder copy.
         *
         * @param {Object} event
         */
    $('#resumeForm').submit(function(event) {
      event.preventDefault();
      var errormsg;

      // validate
      if (!picker.folder.srcId) {
        errormsg =
          "<div class='alert alert-danger' role='alert'>Please select a folder</div>";
        $('#resume-validation-errors').html(errormsg);
        return;
      }

      // Valid!
      DOM.onValid();
      DOM.showProcessingOverlay(
        'Resuming previous copy (this should just take a few moments)'
      );

      picker.folder.resuming = true;

      // count number of triggers
      google.script.run
        .withSuccessHandler(function(number) {
          // prompt user to wait or delete existing triggers
          if (number > 9) {
            DOM.clearProcessingOverlay();
            DOM.hideStep1();
            DOM.showStep2(picker.folder.resuming, 'error');
            DOM.showTooManyTriggers();
          } else {
            // if not too many triggers, initialize script
            google.script.run
              .withSuccessHandler(success)
              .withFailureHandler(showError)
              .resume(picker.folder);
          }
        })
        .withFailureHandler(showError)
        .getTriggersQuantity();
    });
  },

  /**
     * set bindings for input elements in the Start view
     */
  addStartFormListeners: function() {
    var folderTextbox = document.getElementById('folderTextbox');
    folderTextbox.addEventListener(
      'mouseup',
      textboxHandlers.handleMouse,
      false
    );
    folderTextbox.addEventListener('keyup', textboxHandlers.getFileData, false);

    /**
         * Execute when beginning new folder copy
         *
         * Bind form submission action.
         * Disable form elements,
         * Hide description text for app,
         * Show status spinner,
         * run initialization method.
         * 
         * @param {Object} event 
         */
    $('#folderForm').submit(function(event) {
      event.preventDefault();
      var errormsg;

      // validate
      if (!picker.folder.srcId) {
        errormsg =
          "<div class='alert alert-danger' role='alert'>Please select a folder</div>";
        $('#start-validation-errors').html(errormsg);
        return;
      } else if ($('#newFolder').val() === '') {
        errormsg =
          "<div class='alert alert-danger' role='alert'>Please enter a new folder name</div>";
        $('#start-validation-errors').html(errormsg);
        return;
      }

      // Valid!
      DOM.onValid();
      DOM.showProcessingOverlay(
        'Initializing copy request (this should just take a few moments)'
      );

      // Get values from form and selected folder to initialize copy
      picker.folder.destName = $('#newFolder').val();
      picker.folder.permissions =
        $('#permissions-group').find('input:checked').val() == 'yes';
      picker.folder.destLocation = $('#destination-group')
        .find('input:checked')
        .val();

      // count number of triggers
      google.script.run
        .withSuccessHandler(function(number) {
          // prompt user to wait or delete existing triggers
          if (number > 9) {
            DOM.clearProcessingOverlay();
            DOM.hideStep1();
            DOM.showStep2(picker.folder.resuming, 'error');
            DOM.showTooManyTriggers();
          } else {
            // if not too many triggers, initialize script
            google.script.run
              .withSuccessHandler(success)
              .withFailureHandler(showError)
              .initialize(picker.folder);
          }
        })
        .withFailureHandler(showError)
        .getTriggersQuantity();
    });
  },

  /**
     * 
     */
  addDeleteTriggerButtonListeners: function() {
    $('#delete-existing-triggers').click(function() {
      DOM.hideTooManyTriggers();

      google.script.run
        .withSuccessHandler(function() {
          if (picker.folder.resuming) {
            google.script.run
              .withSuccessHandler(success)
              .withFailureHandler(showError)
              .resume(picker.folder);
          } else {
            google.script.run
              .withSuccessHandler(success)
              .withFailureHandler(showError)
              .initialize(picker.folder);
          }
        })
        .withFailureHandler(showError)
        .deleteAllTriggers();
    });
  },

  addPauseButtonListener: function() {
    $('#pause-confirm-button').click(function() {
      google.script.run.setStopFlag();
      DOM.showPauseStep2();
    });
  }
};

/**
 * Hide 'status' indicator, and show success message.
 * Include links to logger spreadsheet and destination folder
 * so user can monitor progress of the copy.
 * Alert user that they can safely close the window now.
 * 
 * @param {Object} results contains id string for logger spreadsheet and destination folder
 */
function success(results) {
  DOM.clearProcessingOverlay();
  DOM.hideStep1(results.resuming);
  DOM.showStep2(results.resuming, 'success');

  // link to spreadsheet and  dest Folder
  var copyLogLink =
    "<a href='https://docs.google.com/spreadsheets/d/" +
    results.spreadsheetId +
    "' target='_blank'>copy log</a>";
  $('.copy-log-link').html(copyLogLink);

  var destFolderLink =
    "<a href='https://drive.google.com/drive/u/0/folders/" +
    results.destId +
    "' target='_blank'>here</a>";
  $('.dest-folder-link').html(destFolderLink);

  google.script.run.copy();
}

/**
 * Build an 'alert' div that contains
 * error message output from Google Apps Script
 * and suggestions for fixing the error
 * 
 * @param {string} msg error message produced by Google Apps Script from initialize() call
 */

function showError(error) {
  DOM.clearProcessingOverlay();
  DOM.hideStep1();
  DOM.showStep2(picker.folder.resuming, 'error');
  DOM.hideTooManyTriggers();
  DOM.showErrors();

  var errorMsg =
    error.message + ' Occurred ' + error.lineNumber + ' ' + error.stack;

  $('.error-message').text(errorMsg);
}
