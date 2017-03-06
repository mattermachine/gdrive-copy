// Requires
// var picker = require('./picker');
// var templates = require('./templates.js');
// var icons = require('./icons');
// var eventListeners = require('./event-listeners');
var tabs = require('./tabs.js');

// event bindings
// TODO: fix how tabs are initialized
// could possibly just move it all into this file...
$(function() {
    // define tabs 
    var myTabs = new tabs({
        // container
        el: '#container',
        // link selector
        tabNavigationLinks: '.tabLink',
        // tab container selector
        tabContentContainers: '.tab'
    });
    // initialize tabs (bind navigation)
    myTabs.init();


    // eventListeners.addNavListeners();
    // eventListeners.addDeleteTriggerButtonListeners();

    // $("#put-forms-here").html(templates.start.render({}, icons));
    // eventListeners.addStartFormListeners();

    // google.script.run
    //     .withSuccessHandler(function(email) {
    //         $(".userEmail").html(email);
    //     })
    //     .withFailureHandler(function(err) {
    //         console.log("couldn't get email");
    //     })
    //     .getUserEmail();
    
});
