var assert = require('chai').assert;
var isNativeGoogleType = require('../lib/files.js').isNativeGoogleType;

describe('Files', function() {
    it('should tell when an object is a native Google Type', function () {
        var item = { mimeType: '' };
        assert.equal(isNativeGoogleType(item), false);
        item.mimeType = 'application/vnd.google-apps.folder';
        assert.equal(isNativeGoogleType(item), true);
        item.mimeType = 'application/vnd.google-apps.document';
        assert.equal(isNativeGoogleType(item), true);
    });
});