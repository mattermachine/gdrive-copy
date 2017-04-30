var assert = require('chai').assert;
var R = require('ramda');
var Files = require('../lib/files').Files;
var Properties = require('../lib/properties').Properties;
var mock = require('./mock');

var sinon = require('sinon');

describe('Files', function() {
  it('should tell when an object is a native Google Type', function() {
    var files = new Files();
    var item = { mimeType: '' };
    assert.equal(files.isNativeGoogleType(item), false);
    item.mimeType = 'application/vnd.google-apps.folder';
    assert.equal(files.isNativeGoogleType(item), true);
    item.mimeType = 'application/vnd.google-apps.document';
    assert.equal(files.isNativeGoogleType(item), true);
  });

  describe('fileList', function() {
    it('should be initialized without an empty fileList', function() {
      // initialized Files should not have a fileList
      var files = new Files();
      assert.equal(files.fileListExists(), false);
    });

    it('should exist when fileList is a non-empty array', function() {
      var files = new Files();
      files.setFileList(['one', 'two', 'three']);
      assert.equal(files.fileListExists(), true);
    });

    it('should be of type Array', function() {
      var files = new Files();
      files.setFileList({
        file1: 'file1',
        file2: 'file2',
        items: ['one', 'two', 'three']
      });
      assert.equal(files.fileListExists(), false);
    });

    it('should be required to have at least one element', function() {
      var files = new Files();
      files.setFileList([]);
      assert.equal(files.fileListExists(), false);
    });
  });

  // TODO: add these (and also add handling for errors)
  describe('Drive API calls', function() {
    var props = new Properties(mock.PropertiesService);

    it('should build parameters correctly', function() {
      var item = mock.item;
      var files = new Files(props);
      var body = files._arrangeRequestBody(item);
      assert.equal(body.description, item.description);
      assert.equal(body.title, item.title);
      assert.equal(body.mimeType, item.mimeType);
      assert.equal(body.parents[0].kind, item.parents[0].kind);

      // This assertion is trivial in this test setup, but in practice these should never match.
      // The new file will have a different parent ID than the source.
      assert.notEqual(body.parents[0].id, item.parents[0].id);
    });

    it('should build an error result object', function() {
      var files = new Files(props);
      var item = {
        id: '12345',
        title: 'testing'
      };
      var error = new Error('test error message');
      var result = files._buildErrorResult(error.message, item.id, item.title);
      assert.equal(result.isError, true);
      assert.equal(result.errMessage, error.message);
      assert.equal(result.id, item.id);
      assert.equal(result.title, item.title);
    });

    it('should build a success result object', function() {
      var files = new Files(props);
      var item = {
        id: '12345',
        title: 'testing'
      };
      var result = files._buildSuccessResult(item.id, item.title);
      assert.equal(result.isError, false);
      assert.equal(result.errMessage, null);
      assert.equal(result.id, item.id);
      assert.equal(result.title, item.title);
    });

    it('should be able to add mappings to Properties', function() {
      var files = new Files(props);
      files._properties.addMapping('123', '456');
      assert.equal(files._properties.getMapping('123'), '456');
      files._properties.addMapping(789, 987);
      assert.equal(files._properties.getMapping(789), 987);
    });

    it('should be able to add remaining to Properties', function() {
      var files = new Files(props);
      var remaining1 = '123ABC';
      var remaining2 = '456DEF';
      var remaining3 = '789GHI';
      files._properties.addToRemaining(remaining1);
      assert.equal(files._properties.getNextRemaining(), remaining1);
      files._properties.addToRemaining(remaining2);
      files._properties.addToRemaining(remaining3);
      assert.equal(files._properties.getNextRemaining(), remaining3);
      assert.equal(files._properties.getNextRemaining(), remaining2);
    });

    describe('Drive.Files.list', function() {
      it('should be able to list files with the Drive service', function() {
        mock.Drive.Files.list.returns({ items: [mock.item] });
        var files = new Files(props, mock.Drive);
        var query = 'testing';
        var list = files.getFiles(query);
        assert.equal(
          mock.Drive.Files.list.calledOnce,
          true,
          'Drive.Files.list not called once'
        );
        assert.equal(
          mock.Drive.Files.list.calledWith({
            q: query,
            maxResults: 1000,
            pageToken: files.getPageToken()
          }),
          true,
          'called with incorrect arguments'
        );
        assert.equal(
          list.items.length,
          1,
          'return items.length not equal to 1'
        );
        assert.equal(
          list.items[0].id,
          mock.item.id,
          'id of return item not equal to mock item'
        );

        // reset sinon stub
        mock.Drive.Files.list.reset();
      });
    });

    describe('Drive.Files.insert', function() {
      it('should be able to call insert files with the Drive service', function() {
        mock.Drive.Files.insert.returns(mock.item);
        var files = new Files(props, mock.Drive);
        var destFolder = files.initializeDestinationFolder(
          mock.DriveApp,
          mock.selectedFolder,
          '01-01-2000'
        );
        assert.equal(
          mock.Drive.Files.insert.calledOnce,
          true,
          'insert not called once'
        );
        assert.equal(
          destFolder.id,
          mock.item.id,
          'returned file resource does not match mock'
        );

        // reset sinon stub
        mock.Drive.Files.insert.reset();
      });

      // TODO: this test works, but really doesn't ensure that the app will fail gracefully, only this one function
      it('should fail gracefully', function() {
        mock.Drive.Files.insert.throws();
        var files = new Files(props, mock.Drive);
        var error = files.initializeDestinationFolder(
          mock.DriveApp,
          mock.selectedFolder,
          '01-01-2000'
        );
        assert.equal(error.message, 'Error', 'return value is not an error');
      });
    });

    it.skip('should be able to copy files with the Drive service', function() {
      var files = new Files(props, mock.Drive);
    });
  });
});
