// Requires
var eventListeners = require('./event-listeners');
var tabs = require('./tabs.js');

$(function() {
    // define tabs 
    var myTabs = tabs({
        // link selector
        tabNavigationLinks: '.tabLink',
        // container selector
        tabContentContainers: '.tab'
    });

    // initialize tabs (bind navigation events)
    myTabs.init();

    // everything is rendered on the same page, so event listeners can be added all at once
    eventListeners.addSelectButtonListeners();
    eventListeners.addStartFormListeners();
    eventListeners.addResumeFormListeners();
    eventListeners.addDeleteTriggerButtonListeners();

    // get user email and put it in the account box
    google.script.run
        .withSuccessHandler(function(email) {
            $(".userEmail").html(email);
        })
        .withFailureHandler(function(err) {
            console.log("couldn't get email");
        })
        .getUserEmail();
});
