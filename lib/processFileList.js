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