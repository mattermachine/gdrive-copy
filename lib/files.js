/*****************************************
 * files.js
 * 
 * Files object contains methods and properties for
 * interacting with the Drive.Files API 
 * 
 ******************************************/


/**
 * Try to copy file to destination parent.
 * Success:
 *   1. Log success in spreadsheet with file ID
 * Failure:
 *   1. Log error in spreadsheet with source ID
 * 
 * @param {Object} file File Resource with metadata from source file
 */
function copyFile(file, map) {
    // if folder, use insert, else use copy
    if ( file.mimeType == "application/vnd.google-apps.folder") {
        try {
            var r = Drive.Files.insert({
                "description": file.description,
                "title": file.title,
                "parents": [
                    {
                        "kind": "drive#fileLink",
                        "id": map[file.parents[0].id]
                    }
                ],
                "mimeType": "application/vnd.google-apps.folder"
            });
            
            // Update list of remaining folders
            // note: properties is a global object found in ./properties/propertiesObject.js
            properties.remaining.push(file.id);

            // map source to destination
            map[file.id] = r.id;
            
            return r;
        }
        
        catch(err) {
            return handleCopyFileError(err);
        }
        
    } else {
        try {
            return Drive.Files.copy(
                {
                "title": file.title,
                "parents": [
                    {
                        "kind": "drive#fileLink",
                        "id": map[file.parents[0].id]
                    }
                ]
                },
                file.id
            );
        }
        
        catch(err) {
            return handleCopyFileError(err);
        }
    }

}

function handleCopyFileError (err) {
    // if the rate limit is exceeded, wait a second or more and try again
    // TODO: test the below code
    if (err.message === 'User rate limit exceeded') {
        Utilities.sleep(1000);
        return copyFile(file, map);
    } else {
        log(null, [err.message, err.fileName, err.lineNumber]);
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
function getFiles(query, pageToken) {
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
function createLoggerSpreadsheet(today, destId) {
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
 * @return {Object} metadata for the properties document, or error on fail.
 */
function createPropertiesDocument(destId) {
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
function initializeDestinationFolder(selectedFolder, today) {
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

    if (selectedFolder.permissions) {
        copyPermissions(selectedFolder.srcId, null, destFolder.id);
    }

    return destFolder;
}
