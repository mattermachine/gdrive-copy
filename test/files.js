var assert = require('chai').assert;
var Files = require('../lib/files.js').Files;
var R = require('ramda');

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

    describe('fileList', function () {
        it('should be initialized without an empty fileList', function () {
            // initialized Files should not have a fileList
            var files = new Files();
            assert.equal(files.fileListExists(), false);
        });

        it('should exist when fileList is a non-empty array', function () {
            var files = new Files();
            files.setFileList(['one', 'two', 'three']);
            assert.equal(files.fileListExists(), true);
        });

        it('should be of type Array', function () {
            var files = new Files();
            files.setFileList({
                file1: 'file1',
                file2: 'file2',
                items: ['one', 'two', 'three']
            });
            assert.equal(files.fileListExists(), false);
        })

        it('should be required to have at least one element', function () {
            var files = new Files();
            files.setFileList([]);
            assert.equal(files.fileListExists(), false);
        });
    });
});