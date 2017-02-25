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