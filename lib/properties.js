/*****************************************
 * properties.js
 * 
 * Properties object contains methods and properties pertaining
 * to the current instance of the Copy Folder application.
 * 
 ******************************************/

// see lib/ramda for explanation of why this is written this way
var R = require ? require('ramda') : R;

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

    // reference to the PropertyService available to Google Apps Scripts 
    var PropertiesService = PropertiesService || null;
    if (PropertiesService) {
        this.Service = PropertiesService.getUserProperties();
    }

    this._spreadsheetId = null;

    this._destFolderId = null;

    return this;
}




/**
 * Get userProperties for current users.
 * Get properties object from userProperties.
 * JSON.parse() and values that need parsing
 *
 * @return {object} properties JSON object with current user's properties
 */

// TODO: Need to massively refactor this so that "leftovers" are retrieved/saved in files
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
        this._destFolderId = JSON.parse(properties.destFolderId);
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
};


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
        stringifiedProps.destFolderId = JSON.parse(this._destFolderId);
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
};

Properties.prototype._getPropertiesDoc = function () {
    return getDocAsText(getPropertiesDocId());
};

// Consider currying setDocContent, then creating a new function upon initialization with the properties doc already passed in
Properties.prototype._setPropertiesDoc = function (content) {
    return setDocContent(getPropertiesDocId(), content);
};

// TODO: these are now stored in Files as fileList, but may still be necessary for saving/loading
Properties.prototype.addLeftovers = function (leftovers) {
    this._leftovers = leftovers;
};

Properties.prototype.getLeftovers = function () {
    return this._leftovers;
};

Properties.prototype.getLeftoverItems = function () {
    return this._leftovers.items;
};

Properties.prototype.getNextItem = function (list) {
    // TODO: consider replacing with R.take or R.takeLast; http://ramdajs.com/docs/#take
    return list.pop();
};

Properties.prototype.addMapping = function (key, value) {
    this._mapping = R.assoc(key, value, this._mapping);
};

Properties.prototype.getMapping = function (key) {
    return this._mapping[key];
};

// just an alias, not sure which naming is more intuitive
Properties.prototype.getDestFrom = function (key) {
    return this.getMapping(key);
};

Properties.prototype.addToRemaining = function (folderId) {
    this._remaining = R.append(folderId, this._remaining);
};

Properties.prototype.getNextRemaining = function () {
    return this._remaining.pop();
};

// return {number}
Properties.prototype.getNumberRemaining = function () {
    return this._remaining.length;
};

// return {boolean}
Properties.prototype.noneRemaining = function () {
    return this.getNumberRemaining === 0;
};

// return {boolean}
Properties.prototype.someRemaining = function () {
    return this.getNumberRemaining > 0;
};

Properties.prototype.shouldCopyPermissions = function () {
    return this._shouldCopyPermissions;
};

Properties.prototype.setShouldCopyPermissions = function (bool) {
    this._shouldCopyPermissions = bool;
};


/**
 * save srcId, destId, copyPermissions, spreadsheetId to userProperties.
 * 
 * This is used when resuming, in which case the IDs of the logger spreadsheet and 
 * properties document will not be known.
 */
Properties.prototype.setUserPropertiesStore = function(props) {
    this.setServiceProperty("destId", props.destId);
    this.setServiceProperty("spreadsheetId", props.spreadsheetId);
    this.setServiceProperty("propertiesDocId", props.propertiesDocId);
    this.setServiceProperty("trials", 0);
    this.setServiceProperty("resuming", props.resuming);
    this.setServiceProperty('stop', 'false');
};

Properties.prototype.setServiceProperty = function (key, value) {
    this.Service.setProperty(key, value);
};

Properties.prototype.getServiceProperty = function (key) {
    return this.Service.getProperty(key);
};

Properties.prototype.getServiceProperties = function () {
    return this.Service.getProperties();
};

Properties.prototype.getPageToken = function () {
    return this._pageToken;
};

Properties.prototype.setPageToken = function (token) {
    this._pageToken = token;
};

Properties.prototype.getDestId = function () {
    return this._destFolderId;
};

Properties.prototype.setDestId = function (id) {
    this._destFolderId = id;
};

Properties.prototype.getSpreadsheetId = function () {
    return this._spreadsheetId;
};

Properties.prototype.getCurrentFolderId = function () {
    if (this.getPageToken()) {
        return this.getDestFolderId();
    }
    return this.getNextRemaining();
};

// //////////////////////////////////////////
// 
// Functions to assist with getting and setting the properties document. 
// Functions are broken down as small as possible in an attempt at a function programming style
// 
// //////////////////////////////////////////

// Can't curry getDocAs because passing MimeType to the curried function is undefined locally; makes mocha fail
var getDocAsText = function (docId) {
    return getDocAs(MimeType.PLAIN_TEXT, docId);
}

var getDocAs = function (mimeType, docId) {
    return getDoc(docId).getAs(mimeType);
};

function setDocContent (docId, content) {
    return getDoc(docId).setContent(content);
}

function getDoc (docId) {
    return DriveApp.getFileById(docId);
}

function getPropertiesDocId () {
    return PropertiesService.getUserProperties().getProperties().propertiesDocId;
}

var alterProps = R.curry(function (fn, parent) {
    var newParent = {};
    function assignProps (prop, i, properties) {
        newParent[prop] = fn(parent[prop]);
    }
    var newChildren = R.map(assignProps, Object.keys(parent));

    return newParent;
});

var parseProps = alterProps(JSON.parse);

var stringifyProps = alterProps(JSON.stringify);

if (module !== undefined) {
    module.exports.Properties = Properties;
    module.exports.alterProps = alterProps;
    module.exports.stringifyProps = stringifyProps;
    module.exports.parseProps = parseProps;
}