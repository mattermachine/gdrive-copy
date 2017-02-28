/**
 * TODO: document this function
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
    var files = new Files(properties);
    var process = new Process();
    
    var query,          // {string} query to generate Files list
        fileList,       // {object} list of files within Drive folder
        currFolderId;   // {string} id of folder whose children are currently being processed


    /*****************************
     * Create the log() function, which just accepts an array of values
     */ 
    log = logToSheet(files.getSpreadsheet());
    properties.setTimezone(SpreadsheetApp.openById(properties.getSpreadsheetId()).getSpreadsheetTimeZone());


    /*****************************
     * Delete previous trigger.
     * 
     * Create trigger for next run.
     * This trigger will be deleted if script finishes successfully 
     * or if the stop flag is set.
     */
    triggers.deleteTrigger(properties.getServiceProperty('triggerId'));
    var newTriggerId = triggers.createTrigger();
    properties.setServiceProperty('triggerId', newTriggerId);


    /*****************************
     * Load properties.
     * If loading properties fails, return the function and
     * set a trigger to retry in 6 minutes.
     */
    try {
        exponentialBackoff(properties.load, 'Error restarting script, trying again...');
    } catch (err) {
        var n = Number(properties.getServiceProperty('trials'));
        Logger.log(n);

        if (n < 5) {
            Logger.log('setting trials property');
            properties.setServiceProperty('trials', (n + 1).toString());

            exponentialBackoff(triggers.createTrigger,
                'Error setting trigger.  There has been a server error with Google Apps Script.' +
                'To successfully finish copying, please refresh the app and click "Resume Copying"' +
                'and follow the instructions on the page.');
        }
        return;
    }


    /*****************************
     * Process leftover files from prior query results
     * that weren't processed before script timed out.
     * Destination folder must be set to the parent of the first leftover item.
     * The list of leftover items is an equivalent array to fileList returned from the getFiles() query
     */
    if (properties.leftoverItemsExist()) {
        // this should already be initialized if it exists
        // properties.destFolder = properties.leftovers.items[0].parents[0].id;
        // TODO: this could (hopefully) be dramatically simplified
        processFileList(properties, properties.getLeftoverItems(), timer);
    } 
    
    
    /*****************************
     * When leftovers are complete, query next folder from properties.remaining
     */     
    while (properties.someRemaining() && timer.canContinue()) {
        // if pages remained in the previous query, use them first
        currFolderId = properties.getCurrentFolderId();        
        
        // TODO: This could be a method on Files
        // build query
        query = '"' + currFolderId + '" in parents and trashed = false';
        
        
        // Query Drive to get the fileList (children) of the current folder, currFolder
        // Repeat if pageToken exists (i.e. more than 1000 results return from the query)
        do {
            try {
                fileList = files.getFiles(query, properties.getPageToken());
            } catch (err) {
                log([err.message, err.fileName, err.lineNumber]);
            }

            // Send items to processFileList() to copy if there is anything to copy
            if (fileList.items && fileList.items.length > 0) {
                processFileList(properties, fileList.items, timer);
            }
            
            // get next page token to continue iteration
            properties.setPageToken(fileList.nextPageToken);
        } while (properties.getPageToken() && timer.canContinue());
        
    }
    
    process.cleanup(properties, timer, triggers, files, fileList);
}
