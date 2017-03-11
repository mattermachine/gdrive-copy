// Requires
// var picker = require('./picker');
// var templates = require('./templates.js');
// var icons = require('./icons');
// var eventListeners = require('./event-listeners');
var tabs = require('./tabs.js');

$(function() {
    // define tabs 
    var myTabs = tabs({
        // link selector
        tabNavigationLinks: '.tabLink',
        // tab container selector
        tabContentContainers: '.tab'
    });
    // initialize tabs (bind navigation)
    console.log('init will be called');
    myTabs.init();
    console.log('init called');



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
