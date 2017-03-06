var assert = require('chai').assert;
var Files = require('../lib/files.js').Files;
var Properties = require('../lib/properties.js').Properties;
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

    // TODO: add these
    describe.skip('Drive API calls', function () {
        it('should build parameters correctly', function () {
            var files = new Files();
            var item = {};
            var body = files._arrangeRequestBody(item);
            assert.equal(R.propEq(body.description, item.description), true);
            assert.equal(R.propEq(body.title, item.title), true);
            assert.equal(R.propEq(body.mimeType, item.mimeType), true);
            assert.equal(R.propEq(body.parents[0].kind, item.parents[0].kind), true);
            // this won't be possible unless I add a reference to Properties and add a mapping
            // assert.equal(R.propEq(body.parents[0].id, item.parents[0].id), true);
        });

        it('should build results correctly', function () {
            var files = new Files();
            var item = {};
            var result = files._buildResult(item);
        });

        it('should be able to add mappings to Properties', function () {
            var properties = new Properties();
            var files = new Files(properties);
            files._properties.addMapping();
            properties.getMapping();
        });

        it('should be able to add remaining to Properties', function () {
            var properties = new Properties();
            var files = new Files(properties);
            files._properties.addRemaining();
            properties.getNextRemaining();
        });
    });
});