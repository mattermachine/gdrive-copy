var assert = require('chai').assert;
var Files = require('../lib/files.js').Files;

describe('Files', function() {
    it('should tell when an object is a native Google Type', function () {
        var files = new Files();
        var item = { mimeType: '' };
        assert.equal(files.isNativeGoogleType(item), false);
        item.mimeType = 'application/vnd.google-apps.folder';
        assert.equal(files.isNativeGoogleType(item), true);
        item.mimeType = 'application/vnd.google-apps.document';
        assert.equal(files.isNativeGoogleType(item), true);
    });

    it('should detect when leftover items exist', function () {
        // initialized Files should not have a fileList
        var files = new Files();
        assert.equal(files.fileListExists(), false);

        // fileList should be an array with values
        files.setFileList(['one', 'two', 'three']);
        assert.equal(files.fileListExists(), true);

        // fileList should not be an object, and it should not have a property `items`
        files.setFileList({
            items: []
        });
        assert.equal(files.fileListExists(), false);

        // empty list should be false
        files.setFileList([]);
        assert.equal(files.fileListExists(), false);
    });
});