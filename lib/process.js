/*****************************************
 * process.js
 * 
 * Process object contains methods and properties for
 * changing the running copy process, e.g. pausing and resuming.
 * 
 ******************************************/

function Process () {
    return this;
}

/**
 * Find prior copy folder instance.
 * Find propertiesDoc and logger spreadsheet, and save IDs to userProperties, which will be used by loadProperties.
 *
 * @param selectedFolder object containing information on folder selected in app
 * @returns {{spreadsheetId: string, destId: string, resuming: boolean}}
 */

function resume(selectedFolder) {

    var priorCopy = findPriorCopy(selectedFolder.srcId);

    Properties.prototype.setUserPropertiesStore({
        destId: selectedFolder.destId,
        propertiesDocId: priorCopy.propertiesDocId,
        spreadsheetId: priorCopy.spreadsheetId, 
        resuming: "true"
    });

    return {
        spreadsheetId: priorCopy.spreadsheetId,
        destId: selectedFolder.srcId,
        resuming: true
    };
}


/**
 * Returns copy log ID and properties doc ID from a paused folder copy.
 */
function findPriorCopy(folderId) {
    // find DO NOT MODIFY OR DELETE file (e.g. propertiesDoc)
    var query = "'" + folderId + "' in parents and title contains 'DO NOT DELETE OR MODIFY' and mimeType = 'text/plain'";
    var p = Drive.Files.list({
        q: query,
        maxResults: 1000,
        orderBy: 'modifiedDate,createdDate'

    });


    // find copy log
    query = "'" + folderId + "' in parents and title contains 'Copy Folder Log' and mimeType = 'application/vnd.google-apps.spreadsheet'";
    var s = Drive.Files.list({
        q: query,
        maxResults: 1000,
        orderBy: 'title desc'
    });

    return {
        'spreadsheetId': s.items[0].id,
        'propertiesDocId': p.items[0].id
    };
}

// TODO: Do we need to pass the fileList? I think this could be saved in a better way
Process.prototype.cleanup = function (properties, timer, triggers, fileList) {
    /*****************************
     * Cleanup
     */     
    // Case: user manually stopped script
    if (timer.isStopped()) {
        saveState(fileList, "Stopped manually by user.  Please use 'Resume' button to restart copying");
        triggers.deleteTrigger(properties.getServiceProperty('triggerId'));
        return;

    // Case: maximum execution time has been reached
    } else if (timer.isTimeUp()) {
        saveState(fileList, "Paused due to Google quota limits - copy will resume in 1-2 minutes");

    // Case: the copy is complete!    
    } else {  
        // Delete trigger created at beginning of script, 
        // move propertiesDoc to trash, 
        // and update logger spreadsheet
         
        triggers.deleteTrigger(Properties.getServiceProperty('triggerId'));
        try {
            Drive.Files.update({ "labels": { "trashed": true } }, properties.getPropertiesDocId());
        } catch (err) {
            log([err.message, err.fileName, err.lineNumber]);
        }
        var ss = Files.prototype.getSpreadsheet();
        ss.getRange(2, 3, 1, 1).setValue("Complete").setBackground("#66b22c");
        ss.getRange(2, 4, 1, 1).setValue(timer.now());
    }
};
