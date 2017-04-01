/*
 * Provide mock data for use in tests
 */

var PropertiesService = {
    getUserProperties: function () {
        var _value = {};
        return {
            setProperty: function (key, value) {
                _value[key] = value;
            },
            getProperty: function (key) {
                return _value[key];
            }
        };
    }
};

var Drive = {
    Files: {
        insert: function () {

        },
        copy: function () {

        },
        list: function () {
            
        }
    }
}

module.exports.PropertiesService = PropertiesService;
module.exports.Drive = Drive;