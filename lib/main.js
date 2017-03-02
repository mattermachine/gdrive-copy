// see lib/ramda for explanation of why this is written this way
var R = require ? require('ramda') : R;

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
    if (files.fileListExists()) {
        // this should already be initialized if it exists
        // properties.destFolder = properties.leftovers.items[0].parents[0].id;
        // TODO: this could (hopefully) be dramatically simplified
        processFileList(files, timer);
    } 
    
    
    /*****************************
     * When leftovers are complete, query next folder from properties.remaining
     */     
    while (properties.someRemaining() && timer.canContinue()) {
        // if pages remained in the previous query, use them first
        currFolderId = properties.getCurrentFolderId();        
        
        // Query Drive to get the fileList (children) of the current folder, currFolder
        // Repeat if pageToken exists (i.e. more than 1000 results return from the query)

        // NOTE TO SELF!!!!!
        // Before this re-write, I used the `fileList` variable to refer to what I now call files._queryResult
        // files._fileList now refers to something completely different!!!!
        // Don't get these confused!!!!!
        do {
            try {
                R.compose(
                    files.setFileList,
                    files.extractFileList,
                    files.setQueryResult,
                    files.getFiles,
                    files.buildQuery
                )(currFolderId)
            } catch (err) {
                log([err.message, err.fileName, err.lineNumber]);
            }

            // Send items to processFileList() to copy if there is anything to copy
            if (files.fileListExists()) {
                processFileList(files, timer);
            }
            
            // get next page token to continue iteration
            R.compose(
                files.setPageToken,
                files.getNextPageToken,
                files.getQueryResult
            )();
        } while (files.getPageToken() && timer.canContinue());
        
    }
    
    process.cleanup(properties, timer, triggers, files, fileList);
}


/**
 * Loops through array of files.items,
 * Applies Drive function to each (i.e. copy),
 * Logs result,
 * Copies permissions if selected and if file is a Drive document,
 * Get current runtime and decide if processing needs to stop. 
 * 
 * @param {Array} items the list of files over which to iterate
 */
function processFileList(properties, list, timer) {
    var item;
    var newfile;
    
    while (list.length > 0 && timer.canContinue()) {
        /*****************************
         * Get next file from passed file list.
         */
        item = properties.getNextItem(list);
        

        /*****************************
         * Copy each (files and folders are both represented the same in Google Drive)
         */
        newItem = Files.prototype.copyItem(item);
        logCopyResult(newItem);


        /*****************************
         * Copy permissions if selected, and if permissions exist to copy
         */
        if (properties.shouldCopyPermissions() && Files.prototype.isNativeGoogleType(item)) {
            Permissions.prototype.copyPermissions(item.id, item.owners, newItem.id);
        }
    }
}

/*****************************
 * Log result of file copy
 */
function logCopyResult (item) {
    var successMessage = item.errMessage ? "Error, " + item.errMessage : "Copied";
    log([
        successMessage,
        item.title,
        '=HYPERLINK("https://drive.google.com/open?id=' + item.id + '","'+ item.title + '")',
        item.id,
        timer.today()
    ]);
}