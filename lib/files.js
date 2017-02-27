/*****************************************
 * files.js
 * 
 * Files object contains methods and properties for
 * interacting with the Drive.Files API 
 * 
 ******************************************/

function Files () {
    return this;
} 

// TODO: Update all log() calls to omit the ss argument

/**
 * Try to copy file to destination parent.
 * Success:
 *   1. Log success in spreadsheet with file ID
 * Failure:
 *   1. Log error in spreadsheet with source ID
 * 
 * @param {Object} file File Resource with metadata from source file
 */
Files.prototype.copyItem = function (item) {
    // if folder, use insert, else use copy
    if ( file.mimeType === "application/vnd.google-apps.folder") {
        return this.copyFolder(item);
    }
    return this.copyFile(item);
}


Files.prototype.copyFile = function (file) {
    var result;
    try {
        var newItem = Drive.Files.copy(
            {
            "title": file.title,
            "parents": [
                {
                    "kind": "drive#fileLink",
                    "id": Properties.prototype.getMapping(file.parents[0].id);
                }
            ]
            },
            file.id
        );

        result = {
            id: newItem.id,
            title: newItem.title,
            errMessage: null
        };
    } catch(err) {
        // TODO: incorporate better error handling for user Rate Limit Exceeded
        // return this.handleCopyItemError(err, file);
        result = {
            id: item.id,
            title: item.title,
            errMessage: err.message
        };
    }

    return result;
}

Files.prototype.copyFolder = function (folder) {
    var result;
    try {
        var newItem = Drive.Files.insert({
            "description": folder.description,
            "title": folder.title,
            "parents": [
                {
                    "kind": "drive#fileLink",
                    "id": Properties.prototype.getMapping(folder.parents[0].id);
                }
            ],
            "mimeType": "application/vnd.google-apps.folder"
        });
        
        // Update list of remaining folders
        Properties.prototype.addToRemaining(folder.id);

        // map source to destination
        Properties.prototype.addMapping(folder.id, newItem.id);

        result = {
            id: newItem.id,
            title: newItem.title,
            errMessage: null
        };
    }
    
    catch(err) {
        // return this.handleCopyItemError(err, folder);
        result = {
            id: item.id,
            title: item.title,
            errMessage: err.message
        };
    }

    return result;
}


Files.prototype.handleCopyItemError = function (err, item) {
    // if the rate limit is exceeded, wait a second or more and try again
    // TODO: test the below code
    if (err.message === 'User rate limit exceeded') {
        wait(1000);
        return this.copyItem(item);
    } else {
        log([err.message, err.fileName, err.lineNumber]);
        return err;
    } 
}


/**
 * Gets files from query and returns fileList with metadata
 * 
 * @param {string} query the query to select files from the Drive
 * @param {string} pageToken the pageToken (if any) for the existing query
 * @return {object} fileList object where fileList.items is an array of children files
 */
Files.prototype.getFiles = function (query, pageToken) {
    return Drive.Files.list({
        q: query,
        maxResults: 1000,
        pageToken: pageToken
    });    
}


/**
 * Create the spreadsheet used for logging progress of the copy
 * 
 * @param {string} today - Stringified version of today's date
 * @param {string} destId - ID of the destination folder, created in createDestinationFolder
 * 
 * @return {Object} metadata for logger spreadsheet, or error on fail 
 */
Files.prototype.createLoggerSpreadsheet = function (today, destId) {
    try {
        return Drive.Files.copy(
            {
            "title": "Copy Folder Log " + today,
            "parents": [
                {
                    "kind": "drive#fileLink",
                    "id": destId
                }
            ]
            },
            "17xHN9N5KxVie9nuFFzCur7WkcMP7aLG4xsPis8Ctxjg"
        );   
    }
    catch(err) {
        return err.message;
    }
}


/**
 * Create document that is used to store temporary properties information when the app pauses.
 * Create document as plain text.
 * This will be deleted upon script completion.
 * 
 * @param {string} destId - the ID of the destination folder
 * @return {string} id for the properties document, or error on fail.
 */
Files.prototype.createPropertiesDocument = function (destId) {
    try {
        var propertiesDoc = DriveApp.getFolderById(destId).createFile('DO NOT DELETE OR MODIFY - will be deleted after copying completes', '', MimeType.PLAIN_TEXT);
        propertiesDoc.setDescription("This document will be deleted after the folder copy is complete.  It is only used to store properties necessary to complete the copying procedure");
        return propertiesDoc.getId(); 
    }
    catch(err) {
        return err.message;
    }
}



/**
 * Create the root folder of the new copy.
 * Copy permissions from source folder to destination folder if copyPermissions == yes
 * 
 * @param {string} srcName - Name of the source folder
 * @param {string} destName - Name of the destination folder being created
 * @param {string} destLocation - "same" results in folder being created in the same parent as source folder, 
 *      "root" results in folder being created at root of My Drive
 * @param {string} srcParentId - ID of the parent of the source folder
 * @return {Object} metadata for destination folder, or error on failure
 */
Files.prototype.initializeDestinationFolder = function (selectedFolder, today) {
    var destFolder;

    try {
        destFolder = Drive.Files.insert({
            "description": "Copy of " + selectedFolder.srcName + ", created " + today,
            "title": selectedFolder.destName,
            "parents": [
                {
                    "kind": "drive#fileLink",
                    "id": selectedFolder.destLocation == "same" ? selectedFolder.srcParentId : DriveApp.getRootFolder().getId()
                }
            ],
            "mimeType": "application/vnd.google-apps.folder"
        });   
    }
    catch(err) {
        return err.message;
    }

    if (Properties.prototype.shouldCopyPermissions()) {
        Permissions.prototype.copyPermissions(selectedFolder.srcId, null, destFolder.id);
    }

    return destFolder;
}

Files.prototype.getSpreadsheet = function () {
    return SpreadsheetApp.openById(Properties.prototype.getServiceProperty('spreadsheetId')).getSheetByName("Log");
}

Files.prototype.isNativeGoogleType = function (item) {
    return (item.mimeType === "application/vnd.google-apps.document" ||
        item.mimeType === "application/vnd.google-apps.folder" ||
        item.mimeType === "application/vnd.google-apps.spreadsheet" ||
        item.mimeType === "application/vnd.google-apps.presentation" ||
        item.mimeType === "application/vnd.google-apps.drawing" ||
        item.mimeType === "application/vnd.google-apps.form" ||
        item.mimeType === "application/vnd.google-apps.script" );
}