/**
 * Copy folders and files from source to destination.
 * Get parameters from userProperties,
 * Loop until time runs out,
 * then call timeout methods, saveProperties and createTrigger.
 *
 * @param {boolean} resuming whether or not the copy call is resuming an existing folder copy or starting fresh
 */
function copy() { 
    /*****************************
     * Initialize timers, initialize variables for script, and update current time
     */
    var timer = new Timer();
    var triggers = new Triggers();
    var properties = new Properties();
    var files = new Files();
    
    var ss,             // {object} instance of Sheet class
        query,          // {string} query to generate Files list
        fileList,       // {object} list of files within Drive folder
        currFolder,     // {object} metadata of folder whose children are currently being processed
        // TODO: This could be added as a property to Properties
        timeZone,       // {string} time zone of user
        triggerId = Properties.getServiceProperty('triggerId');      // {string} Unique ID for the most recently created trigger




    /*****************************
     * Delete previous trigger
     */
    Triggers.deleteTrigger(triggerId);

    /*****************************
     * Create trigger for next run.
     * This trigger will be deleted if script finishes successfully 
     * or if the stop flag is set.
     */
    var newTriggerId = Triggers.createTrigger();
    Properties.setServiceProperty('triggerId', newTriggerId);




    /*****************************
     * Load properties.
     * If loading properties fails, return the function and
     * set a trigger to retry in 6 minutes.
     */

    // TODO: This requires some serious refactoring. Maybe I could call exponentialBackoff(Properties.load()) ?
    try {
        Properties.load();
        properties = exponentialBackoff(loadProperties, 'Error restarting script, trying again...');
    } catch (err) {
        var n = Number(userProperties.getProperties().trials);
        Logger.log(n);

        if (n < 5) {
            Logger.log('setting trials property');
            userProperties.setProperty('trials', (n + 1).toString());

            exponentialBackoff(createTrigger,
                'Error setting trigger.  There has been a server error with Google Apps Script.' +
                'To successfully finish copying, please refresh the app and click "Resume Copying"' +
                'and follow the instructions on the page.');
        }
        return;
    }


    /*****************************
     * Initialize logger spreadsheet and timeZone
     */ 
    ss = SpreadsheetApp.openById(properties.spreadsheetId).getSheetByName("Log");
    timeZone = SpreadsheetApp.openById(properties.spreadsheetId).getSpreadsheetTimeZone();
    if (timeZone === undefined || timeZone === null) {
        timeZone = 'GMT-7';
    }

    

    /*****************************
     * Process leftover files from prior query results
     * that weren't processed before script timed out.
     * Destination folder must be set to the parent of the first leftover item.
     * The list of leftover items is an equivalent array to fileList returned from the getFiles() query
     */
    if (Properties.leftoverItemsExist()) {
        // TODO: this could be initialized as a property on Properties when load() is called
        properties.destFolder = properties.leftovers.items[0].parents[0].id;
        // TODO: this could (hopefully) be dramatically simplified
        processFileList(properties.leftovers.items, timeZone, properties.permissions, userProperties, timers, properties.map, ss);    
    } 
    



    
    /*****************************
     * When leftovers are complete, query next folder from properties.remaining
     */     
    while (Properties.someRemaining() && timer.canContinue()) {
        // if pages remained in the previous query, use them first
        // TODO: where is properties.pageToken set? I need to incorporate this into the Properties object
        if (properties.pageToken) {
            currFolder = properties.destFolder;
        } else {
            currFolder = Properties.getNextRemaining();
        }
        
        
        // TODO: This could be a method on Files
        // build query
        query = '"' + currFolder + '" in parents and trashed = false';
        
        
        // Query Drive to get the fileList (children) of the current folder, currFolder
        // Repeat if pageToken exists (i.e. more than 1000 results return from the query)
        do {

            try {
                fileList = files.getFiles(query, properties.pageToken);
            } catch (err) {
                log(ss, [err.message, err.fileName, err.lineNumber]);
            }

            // Send items to processFileList() to copy if there is anything to copy
            if (fileList.items && fileList.items.length > 0) {
                processFileList(fileList.items, timeZone, properties.permissions, userProperties, timers, properties.map, ss);
            } else {
                Logger.log('No children found.');
            }
            
            // TODO: make a method to set/get the pageToken
            // get next page token to continue iteration
            properties.pageToken = fileList.nextPageToken;

        } while (properties.pageToken && timer.canContinue());
        
    }
    


    // TODO: move this to Process.cleanup();
    /*****************************
     * Cleanup
     */     
    // Case: user manually stopped script
    if (timer.isStopped()) {
        saveState(fileList, "Stopped manually by user.  Please use 'Resume' button to restart copying", ss);
        Triggers.deleteTrigger(Properties.getServiceProperty('triggerId'));
        return;

    // Case: maximum execution time has been reached
    } else if (timer.isTimeUp()) {
        saveState(fileList, "Paused due to Google quota limits - copy will resume in 1-2 minutes", ss);

    // Case: the copy is complete!    
    } else {  
        // Delete trigger created at beginning of script, 
        // move propertiesDoc to trash, 
        // and update logger spreadsheet
         
        Triggers.deleteTrigger(Properties.getServiceProperty('triggerId'));
        try {
            Drive.Files.update({"labels": {"trashed": true}},properties.propertiesDocId);
        } catch (err) {
            log(ss, [err.message, err.fileName, err.lineNumber]);
        }
        ss.getRange(2, 3, 1, 1).setValue("Complete").setBackground("#66b22c");
        ss.getRange(2, 4, 1, 1).setValue(Utilities.formatDate(new Date(), timeZone, "MM-dd-yy hh:mm:ss a"));
    }
}