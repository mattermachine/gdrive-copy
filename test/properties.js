var assert = require('chai').assert;
var Properties = require('../lib/properties.js').Properties;
var alterProps = require('../lib/properties.js').alterProps;
var parseProps = require('../lib/properties.js').parseProps;
var stringifyProps = require('../lib/properties.js').stringifyProps;

describe('Properties', function() {
    it('should detect when leftover items exist', function () {
        var props = new Properties();
        assert.equal(props.leftoverItemsExist(), false);

        props.addLeftovers(['one', 'two', 'three']);
        assert.equal(props.leftoverItemsExist(), false);

        props.addLeftovers({
            items: []
        });
        assert.equal(props.leftoverItemsExist(), false);

        props.addLeftovers({
            items: ['one', 'two', 'three']
        });
        assert.equal(props.leftoverItemsExist(), true);
    });

    it('should be able to apply a function to all props in an object', function() {
        function addTail (item) {
            return item + ' added tail!'
        }

        var originalObj = {
            owner: 'eric',
            lastModified: 'yesterday',
            parents: 'kay, steve'
        };

        var newObj = alterProps(addTail, originalObj);

        // verify that the function was applied to all properties
        Object.keys(newObj).forEach(function(prop, i, properties) {
            assert.equal(newObj[prop], originalObj[prop] + ' added tail!');
        })

        // original object should not be modified in this procedure
        assert.notDeepEqual(newObj, originalObj);
    });

    it('should be able to stringify all props in an object', function() {
        var fileObj = {
            items: [
                'one', 'two', 'three'
            ],
            owner: {
                name: 'eric',
                type: 'user'
            },
            lastModified: '2016-01-01 12:34:35'
        };

        var stringifiedFileObj = stringifyProps(fileObj);

        // original object should not be modified in this procedure
        assert.notDeepEqual(stringifiedFileObj, fileObj);

        // make sure JSON.stringify was properly applied to all props
        var manualFileObj = {
            items: JSON.stringify(fileObj.items),
            owner: JSON.stringify(fileObj.owner),
            lastModified: JSON.stringify(fileObj.lastModified)
        }
        assert.deepEqual(stringifiedFileObj, manualFileObj);
    });

    it('should be able to parse all props in an object', function() {
        // create stringified object
        var fileObj = {
            items: [
                'one', 'two', 'three'
            ],
            owner: {
                name: 'eric',
                type: 'user'
            },
            lastModified: '2016-01-01 12:34:35'
        };

        var stringifiedFileObj = stringifyProps(fileObj);
        var parsedFileObj = parseProps(stringifiedFileObj);

        // make sure JSON.stringify was properly applied to all props
        var manualFileObj = {
            items: JSON.parse(stringifiedFileObj.items),
            owner: JSON.parse(stringifiedFileObj.owner),
            lastModified: JSON.parse(stringifiedFileObj.lastModified)
        };

        assert.deepEqual(parsedFileObj, manualFileObj);

        // the parsed version should be equal to the original
        assert.deepEqual(parsedFileObj, fileObj);
    });

    it('should be able to add a new key/value pair', function () {
        var props = new Properties();
        var obj = { 'one': 'ONE', 'two': 'TWO' };
        props._mapping = obj;
        props.addMapping('three', 'THREE');
        assert.deepEqual(props._mapping, Object.assign(obj, {'three': 'THREE'}));
        assert.equal(props.getMapping('three'), 'THREE');
    });
})