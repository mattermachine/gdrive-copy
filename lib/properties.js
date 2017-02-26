/*****************************************
 * properties.js
 * 
 * Properties object contains methods and properties pertaining
 * to the current instance of the Copy Folder application
 * 
 ******************************************/

function Properties () {
    // array of {string} folder IDs that are left to be processed
    // This list is dynamically updated during the copy process:
    // when a child folder is found, it is pushed into the list
    // when a child folder is being processes, it is popped from the list.
    this._remaining = [];

    // This is a simple object used to map the source folders (keys) to the destination folders (values). 
    // Keys and values are both folder IDs, meaning every value is a simple string. 
    // There are no nested objects. 
    // This mapping is updated whenever a new folder is identified in the copy process. 
    // Values are never removed from this object.
    this._mapping = {};

    // A boolean indicating whether or not permissions should be copied from source to destination
    this._shouldCopyPermissions = false;

    // A query object that were returned during the query from the previous run.
    // Defined by: https://developers.google.com/drive/v2/reference/files/list
    // Since the copy procedure must be interrupted to avoid going over the Google quotas, 
    // the query items need to be stored so they can be processed first on the next run. 
    // The leftovers object contains file objects which are described in detail in the Google Apps Script documentation:
    // https://developers.google.com/drive/v2/reference/files
    this._leftovers = {};

    return this;
}




/**
 * Get userProperties for current users.
 * Get properties object from userProperties.
 * JSON.parse() and values that need parsing
 *
 * @return {object} properties JSON object with current user's properties
 */
Properties.prototype.load = function () {
    var properties, propertiesDoc;

    try {
        propertiesDoc = this._getPropertiesDoc();
        properties = JSON.parse(propertiesDoc.getDataAsString());
    } catch (err) {
        throw err;
    }

    try {
        this._remaining = JSON.parse(properties.remaining);
        this._map = JSON.parse(properties.map);
        this._permissions = JSON.parse(properties.permissions);
        this._leftovers = JSON.parse(properties.leftovers);
    } catch (err) {
        throw err;
    }

    try {
        if (this.leftoverItemsExist()) {
            this._leftovers.items = JSON.parse(properties.leftovers.items);
            this._leftovers.items = parseProps(this._leftovers.items);
        } 
    } catch (err) {
        throw err;
    }

    return this;
}


/**
 * Loop through keys in properties argument,
 * converting any JSON objects to strings.
 * On completetion, save properties to userProperties
 * 
 * Keep in mind, properties are updated dynamically in the application,
 * so at any point in time, this._PROP_NAME should be the source of truth
 * for the application.
 */
Properties.prototype.save = function () {
    // the properties doc does not need to include any stringified functions from the prototype
    // so create a new object that will contain only the essential properties to save
    var stringifiedProps = {};
    try {
        stringifiedProps.remaining = JSON.stringify(this._remaining);
        stringifiedProps.map = JSON.stringify(this._map);
        stringifiedProps.permissions = JSON.stringify(this._permissions);
        stringifiedProps.leftovers = JSON.stringify(this._leftovers);
    } catch (err) {
        throw err;
    }


    try {
        if (this.leftoverItemsExist()) {
            stringifiedProps.leftovers.items = JSON.stringify(this._leftovers.items);
            stringifiedProps.leftovers.items = stringifyProps(this._leftovers.items);
        }
    } catch (err) {
        throw err;
    }

    try {
        this._setPropertiesDoc(JSON.stringify(stringifiedProps));
    } catch (err) {
        throw err;
    }
}

Properties.prototype._getPropertiesDoc = function () {
    return getDocAsText(getPropertiesDocId());
}

Properties.prototype._setPropertiesDoc = function (content) {
    return setDocContent(getPropertiesDocId(), content);
}


Properties.prototype.addLeftovers = function (leftovers) {
    this._leftovers = leftovers;
    return;
}

/**
 * @return {boolean} true if leftover items exist and length is greater than 0
 */
Properties.prototype.leftoverItemsExist = function (key) {
    return (exists(this._leftovers) &&
        exists(this._leftovers.items) &&
        this._leftovers.items.length !== 0);
}

Properties.prototype.addMapping = function (key, value) {
    this._mapping = Object.assign({}, this._mapping, createObject(key, value));
}

Properties.prototype.getMapping = function (key) {
    return this._mapping[key];
}

// just an alias, not sure which naming is more intuitive
Properties.prototype.getDestFrom = function (key) {
    return this.getMapping(key);
}

Properties.prototype.addToRemaining = function (folderId) {
    this._remaining.push(folderId);
}

Properties.prototype.getNextRemaining = function () {
    return this._remaining.pop();
}

// return {number}
Properties.prototype.getNumberRemaining = function () {
    return this._remaining.length;
}

// return {boolean}
Properties.prototype.noneRemaining = function () {
    return this.getNumberRemaining === 0;
}

Properties.prototype.shouldCopyPermissions = function () {
    return this._shouldCopyPermissions;
}

Properties.prototype.setShouldCopyPermissions = function (bool) {
    this._shouldCopyPermissions = bool;
}


// //////////////////////////////////////////
// 
// Functions to assist with getting and setting the properties document. 
// Functions are broken down as small as possible in an attempt at a function programming style
// 
// //////////////////////////////////////////

function getDocAsText (docId) {
    return getDocAs(docId, MimeType.PLAIN_TEXT);
}

function getDocAs (docId, mimeType) {
    return getDoc(docId).getAs(mimeType);
}

function setDocContent (docId, content) {
    return getDoc(docId).setContent(content);
}

function getDoc (docId) {
    return DriveApp.getFileById(docId);
}

function getPropertiesDocId () {
    return PropertiesService.getUserProperties().getProperties().propertiesDocId;
}

function parseProps (item) {
    return alterProps(JSON.parse, item);
}

function stringifyProps (item) {
    return alterProps(JSON.stringify, item);
}

function alterProps (fn, parent) {
    var newParent = {};
    var newChildren = Object.keys(parent).map(function (prop, i, properties) {
        if (parent.hasOwnProperty(prop)) {
            newParent[prop] = fn(parent[prop]);
        }
    });

    return newParent;
}

function exists (prop) {
    return prop !== null && prop !== undefined;
}

function createObject (key, value) {
    var obj = {};
    obj[key] = value;
    return obj;
}

module.exports.Properties = Properties;
module.exports.alterProps = alterProps;
module.exports.stringifyProps = stringifyProps;
module.exports.parseProps = parseProps;