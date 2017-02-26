/*****************************************
 * public.js
 * 
 * Contains methods that must be accessible to the client-side
 * library without being wrapped inside objects that need to be
 * instantiated.
 * 
 * Since Google Apps Script uses a global scope for all statements
 * in all files, these are also accessible to other files within /lib.
 * 
 ******************************************/

/**
 * Serves HTML of the application for HTTP GET requests.
 * If folderId is provided as a URL parameter, the web app will list
 * the contents of that folder (if permissions allow). Otherwise
 * the web app will list the contents of the root folder.
 *
 * @param {Object} e event parameter that can contain information
 *     about any URL parameters provided.
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  
  // Build and return HTML in IFRAME sandbox mode.
  return template.evaluate()
      .setTitle('Copy a Google Drive folder')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}


/**
 * Invokes a function, performing up to 5 retries with exponential backoff.
 * Retries with delays of approximately 1, 2, 4, 8 then 16 seconds for a total of
 * about 32 seconds before it gives up and rethrows the last error.
 * See: https://developers.google.com/google-apps/documents-list/#implementing_exponential_backoff
 * Author: peter.herrmann@gmail.com (Peter Herrmann)
 * @param {Function} func The anonymous or named function to call.
 * @param {string} errorMsg Message to output in case of error
 * @return {*} The value returned by the called function.
 */
function exponentialBackoff(func, errorMsg) {
    for (var n=0; n<6; n++) {
        try {
            return func();
        } catch(e) {
            log(null, [e.message, e.fileName, e.lineNumber]);
            if (n == 5) {
                log(null, [errorMsg, '', '', '', Utilities.formatDate(new Date(), 'GMT-7', "MM-dd-yy hh:mm:ss aaa")]);
                throw e;
            }
            Utilities.sleep((Math.pow(2,n)*1000) + (Math.round(Math.random() * 1000)));
        }
    }
}

/**
 * Returns token for use with Google Picker
 */
function getOAuthToken() {
    return ScriptApp.getOAuthToken();
}

/**
 * Logs values to the logger spreadsheet
 *
 * @param {object} ss instance of Sheet class representing the logger spreadsheet
 * @param {Array} values array of values to be written to the spreadsheet
 */
function log(ss, values) {
    if (ss === null || ss === undefined) {
        ss = SpreadsheetApp.openById(PropertiesService.getUserProperties().getProperties().spreadsheetId).getSheetByName("Log");
    }

    return ss.getRange(ss.getLastRow()+1, 1, 1, values.length).setValues([values]);
}

/**
 * Delete existing triggers, save properties, and create new trigger
 * 
 * @param {string} logMessage - The message to output to the log when state is saved
 */
function saveState(fileList, logMessage, ss) {

    try {
        // save, create trigger, and assign pageToken for continuation
        properties.leftovers = fileList && fileList.items ? fileList : properties.leftovers;
        properties.pageToken = properties.leftovers.nextPageToken;
    } catch (err) {
        log(ss, [err.message, err.fileName, err.lineNumber]);
    }

    try {
        saveProperties(properties);
        
    } catch (err) {
        log(ss, [err.message, err.fileName, err.lineNumber]);
    }

    log(ss, [logMessage]);
}

/**
 * save srcId, destId, copyPermissions, spreadsheetId to userProperties.
 * 
 * This is used when resuming, in which case the IDs of the logger spreadsheet and 
 * properties document will not be known.
 */
function setUserPropertiesStore(spreadsheetId, propertiesDocId, destId, resuming) {
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty("destId", destId);
    userProperties.setProperty("spreadsheetId", spreadsheetId);
    userProperties.setProperty("propertiesDocId", propertiesDocId);
    userProperties.setProperty("trials", 0);
    userProperties.setProperty("resuming", resuming);
    userProperties.setProperty('stop', 'false');
} 

/**
 * Returns number of existing triggers for user.
 * @return {number} triggers the number of active triggers for this user
 */
function getTriggersQuantity() {
    return ScriptApp.getProjectTriggers().length;
}


/**
 * Loop over all triggers and delete
 */
function deleteAllTriggers() {
    var allTriggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < allTriggers.length; i++) {
        ScriptApp.deleteTrigger(allTriggers[i]);
    }
}

/**
 * Set a flag in the userProperties store that will cancel the current copy folder process 
 */
function setStopFlag() {
    return PropertiesService.getUserProperties().setProperty('stop', 'true');
}

/**
 * get the email of the active user
 */
function getUserEmail() {
    return Session.getActiveUser().getEmail();    
}

/**
 * Returns metadata for input file ID
 * 
 * @param {string} id the folder ID for which to return metadata
 * @return {object} the metadata for the folder
 */
function getMetadata(id) {
    return Drive.Files.get(id);
}

/**
 * Initialize destination folder, logger spreadsheet, and properties doc.
 * Build/add properties to selectedFolder so it can be saved to the properties doc.
 * Set UserProperties values and save properties to propertiesDoc.
 * Add link for destination folder to logger spreadsheet.
 * Return IDs of created destination folder and logger spreadsheet
 * 
 * @param {object} selectedFolder contains srcId, srcParentId, destName, permissions, srcName
 */
function initialize(selectedFolder) {

    /*****************************
     * Declare variables used in project initialization 
     */
    var destFolder,     // {Object} instance of Folder class representing destination folder
        spreadsheet,    // {Object} instance of Spreadsheet class
        propertiesDocId,  // {Object} metadata for Google Document created to hold properties
        today = Utilities.formatDate(new Date(), "GMT-5", "MM-dd-yyyy"); // {string} date of copy
    

    /*****************************
     * Create Files used in copy process
     */
    destFolder = initializeDestinationFolder(selectedFolder, today);

    spreadsheet = createLoggerSpreadsheet(today, destFolder.id);

    propertiesDocId = createPropertiesDocument(destFolder.id);

    

    
    /*****************************
     * Build/add properties to selectedFolder so it can be saved to the properties doc
     */
    selectedFolder.destId = destFolder.id;
    selectedFolder.spreadsheetId = spreadsheet.id;
    selectedFolder.propertiesDocId = propertiesDocId;

    // initialize map with top level source and destination folder
    selectedFolder.leftovers = {}; // {Object} FileList object (returned from Files.list) for items not processed in prior execution (filled in saveState)
    selectedFolder.map = {};       // {Object} map of source ids (keys) to destination ids (values)
    selectedFolder.map[selectedFolder.srcId] = selectedFolder.destId;
    selectedFolder.remaining = [selectedFolder.srcId];

    
    

    /*****************************
     * Set UserProperties values and save properties to propertiesDoc
     */
    setUserPropertiesStore(selectedFolder.spreadsheetId, selectedFolder.propertiesDocId, selectedFolder.destId, "false");
    saveProperties(selectedFolder);




    /*****************************
     * Add link for destination folder to logger spreadsheet
     */
    SpreadsheetApp.openById(spreadsheet.id).getSheetByName("Log").getRange(2,5).setValue('=HYPERLINK("https://drive.google.com/open?id=' + destFolder.id + '","'+ selectedFolder.destName + '")');
    

    

    /*****************************
     * Return IDs of created destination folder and logger spreadsheet
     */
    return {
        spreadsheetId: selectedFolder.spreadsheetId,
        destId: selectedFolder.destId,
        resuming: false
    };
    
}

// Google Apps Script does not use a module system.
// Instead, every *.gs file is placed in the global scope within an application. 
// However, for writing unit tests it is useful to be able to export objects and methods 
// so they can be imported by the test script. 
// While the lib/*.js files won't complain about having module.exports declared,
// Google Apps Script will treat this as an undefined variable unless it is somewhere in the global scope.
// TL;DR: This is being defined simply for testing purposes
var module = {
    exports: {}
};