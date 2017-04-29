/**
 * This module provides functions that control the
 * showing/hiding of DOM elements.
 */

module.exports = {
  /**
    * Updates "Select Folder" fields with selected folder info
    */
  folderIsSelected: function(selectedFolder) {
    // update display
    $('.getFolderErrors').text('');
    $('#newFolder').val(selectedFolder.destName);
    $('.folderName').text(selectedFolder.srcName);

    $('.folderSelect').hide();
    $('.folderLookup').hide();
    $('.selectedFolderInfo').show();
  },

  /**
    * Function to alert user that folder is being identified
    * Hides folder
    */
  onFolderLookup: function() {
    $('.folderLookup').show();
    $('.folderSelect').hide();
  },

  /**
    * Called when either form validates.
    * Updates UI to indicate that the app is initializing.
    */
  onValid: function() {
    $('#errors').html('');
    $('#start-validation-errors').html('');
    $('#resume-validation-errors').html('');
  },

  /**
    * Resets form to default state
    */
  resetForm: function() {
    $('.folderSelect').show();
    $('.selectedFolderInfo').hide();
    $('.getFolderErrors').hide();
  },

  /**
     * Show an overlay with a spinner and a message
     */
  showProcessingOverlay: function(message) {
    var overlay = document.querySelector('.overlay');
    var overlayMessage = document.querySelector('.overlay__message');
    overlay.style.display = 'block';
    overlayMessage.innerText = message;
  },

  /**
     * Hide the overlay
     */
  clearProcessingOverlay: function() {
    var overlay = document.querySelector('.overlay');
    var overlayMessage = document.querySelector('.overlay__message');
    overlay.style.display = 'none';
    overlayMessage.innerText = '';
  },

  hideStep1: function(resuming) {
    // Hide step 1 for Start or Resuming
    var id = resuming ? 'resume-step1' : 'start-step1';
    document.getElementById(id).style.display = 'none';
  },

  /**
     * shows either `resume-success`, `resume-error`, `start-success`, or `start-error`
     * Can also show both start and resume at same time if resuming is null or undefined.
     * 
     * @param {boolean} resuming
     * @param {string} successfulness should be either 'error' or 'success'
     */
  showStep2: function(resuming, successfulness) {
    if (resuming === null || resuming === undefined) {
      document.getElementById('start-' + successfulness).style.display =
        'block';
      return;
    }
    var id = resuming ? 'resume' : 'start';
    id += '-' + successfulness;
    document.getElementById(id).style.display = 'block';
  },

  showTooManyTriggers: function() {
    $('.too-many-triggers').show();
  },

  hideTooManyTriggers: function() {
    $('.too-many-triggers').hide();
  },

  showErrors: function() {
    $('.errors').show();
  },

  hideErrors: function() {
    $('.errors').hide();
  },

  showPauseStep2: function() {
    document.getElementById('pause-step1').style.display = 'none';
    document.getElementById('pause-step2').style.display = 'block';
  }
};
