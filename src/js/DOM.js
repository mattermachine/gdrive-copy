/**
 * This module provides functions that control the
 * showing/hiding of DOM elements.
 */

module.exports = {
    /**
    * Updates "Select Folder" fields with selected folder info
    */
    folderIsSelected: function (selectedFolder) {
        // update display
        $(".getFolderErrors").text("");
        $("#newFolder").val(selectedFolder.destName);
        $(".folderName").text(selectedFolder.srcName);
        
        $(".folderSelect").hide();
        $(".folderLookup").hide();
        $(".selectedFolderInfo").show();
    },
    
    
    /**
    * Function to alert user that folder is being identified
    * Hides folder
    */
    onFolderLookup: function () {
        $(".folderLookup").show();
        $(".folderSelect").hide();
    }, 
    
    
    
    
    /**
    * Called when either form validates.
    * Updates UI to indicate that the app is initializing.
    */
    onValid: function () {
        $("#errors").html("");
        $("#start-validation-errors").html("");
        $("#resume-validation-errors").html("");
    },
    
    
    
    /**
    * Resets form to default state
    */
    resetForm: function () {
        $(".folderSelect").show();
        $(".selectedFolderInfo").hide();
        $(".getFolderErrors").hide();
    },

    /**
     * Show an overlay with a spinner and a message
     */
    showProcessingOverlay: function (message) {
        var overlay = document.querySelector('.overlay');
        var overlayMessage = document.querySelector('.overlay__message');
        overlay.style.display = 'block';
        overlayMessage.innerText = message;
    },

    /**
     * Hide the overlay
     */
    clearProcessingOverlay: function () {
        var overlay = document.querySelector('.overlay');
        var overlayMessage = document.querySelector('.overlay__message');
        overlay.style.display = 'none';
        overlayMessage.innerText = '';
    }
};

