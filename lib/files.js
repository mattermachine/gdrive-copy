/*****************************************
 * files.js
 * 
 * Files object contains methods and properties for
 * interacting with the Drive.Files API.
 * 
 * Contains the file list which represents the master copy
 * of files to be copied.  Also contains methods related to
 * querying the Drive API, such as the page token.
 * 
 ******************************************/

// see lib/ramda for explanation of why this is written this way
try {
    var R = require('ramda');
} catch (err) {
    Logger.log(err);
}

function Files (properties) {
    this._properties = properties;
    this._query = '';
    // A query object that were returned during the query from the previous run.
    // Defined by: https://developers.google.com/drive/v2/reference/files/list
    // Since the copy procedure must be interrupted to avoid going over the Google quotas, 
    // the query items need to be stored so they can be processed first on the next run. 
    // The leftovers object contains file objects which are described in detail in the Google Apps Script documentation:
    // https://developers.google.com/drive/v2/reference/files
    this._queryResult = {};
    this._fileList = [];
    this._pageToken = null;
    return this;
} 

// TODO: Update all log() calls to omit the ss argument

Files.prototype.setQueryResult = function (queryResult) {
    this._queryResult = queryResult;
}

Files.prototype.getQueryResult = function () {
    return this._queryResult;
}

Files.prototype.extractFileList = function (queryResult) {
    return queryResult.items;
}

Files.prototype.getNextPageToken = function (queryResult) {
    return queryResult.nextPageToken;
}

Files.prototype.setFileList = function (fileList) {
    this._fileList = fileList;
};

Files.prototype.getFileList = function () {
    return this._fileList;
};

Files.prototype.getNextFile = function () {
    // TODO: consider replacing with R.take or R.takeLast; http://ramdajs.com/docs/#take
    return this._fileList.pop();
}

Files.prototype.buildQuery = function (folderId) {
    return '"' + folderId + '" in parents and trashed = false';
}

Files.prototype.setQuery = function (query) {
    this._query = query;
}

Files.prototype.getPageToken = function () {
    return this._pageToken;
}


// @return {boolean} true if leftover items exist and length is greater than 0
// using R.either because it performs short-circuit logic
Files.prototype.fileListExists = function () {
    // TODO: would it be more concise/readable if this were a function to determine validity, instead of invalidity?
    var isInvalid = R.anyPass([
        R.isNil,
        R.isEmpty,
        // not of type array
        R.compose(R.not, R.equals('Array'), R.type)
    ]);
    return R.not(isInvalid(this._fileList));
};

Files.prototype._arrangeRequestBody = function (item) {
    return {
        "title": item.title,
        "description": item.description,
        "parents": [
            {
                "kind": "drive#fileLink",
                "id": this._properties.getMapping(item.parents[0].id)
            }
        ],
        "mimeType": item.mimeType
    };
}

Files.prototype._buildResult = function (item, err) {
    return {
        id: item.id,
        title: item.title,
        errMessage: item.message
    };
}

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
};


Files.prototype.copyFile = function (file) {
    try {
        var newItem = Drive.Files.copy(
            this._arrangeRequestBody(file),
            file.id
        );

        return this._buildResult(newItem, null);
    } catch(err) {
        // TODO: incorporate better error handling for user Rate Limit Exceeded
        // return this.handleCopyItemError(err, file);
        return this._buildResult(item, err);
    }
};

Files.prototype.copyFolder = function (folder) {
    try {
        var newItem = Drive.Files.insert(this._arrangeRequestBody(folder));
        
        // Update list of remaining folders
        this._properties.addToRemaining(folder.id);

        // map source to destination
        this._properties.addMapping(folder.id, newItem.id);

        return this._buildResult(newItem, null);
    }
    
    catch(err) {
        // return this.handleCopyItemError(err, folder);
        return this._buildResult(item, err);
    }
};


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
};


/**
 * Gets files from query and returns fileList with metadata
 * 
 * @param {string} query the query to select files from the Drive
 * @param {string} pageToken the pageToken (if any) for the existing query
 * @return {object} fileList object where fileList.items is an array of children files
 */
Files.prototype.getFiles = function (query) {
    return Drive.Files.list({
        q: query,
        maxResults: 1000,
        pageToken: this.getPageToken()
    });    
};


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
};


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
};



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

    if (this._properties.shouldCopyPermissions()) {
        Permissions.prototype.copyPermissions(selectedFolder.srcId, null, destFolder.id);
    }

    return destFolder;
};

Files.prototype.getSpreadsheet = function () {
    return SpreadsheetApp.openById(this._properties.getServiceProperty('spreadsheetId')).getSheetByName("Log");
};

Files.prototype.isNativeGoogleType = function (item) {
    return R.contains(item.mimeType, [
        "application/vnd.google-apps.document",
        "application/vnd.google-apps.folder",
        "application/vnd.google-apps.spreadsheet",
        "application/vnd.google-apps.presentation",
        "application/vnd.google-apps.drawing",
        "application/vnd.google-apps.form",
        "application/vnd.google-apps.script"
    ]);
};

if (module !== undefined) {
    module.exports['Files'] = Files;
}
