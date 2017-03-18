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
    eventListeners.addPauseButtonListener();

    try {
        // get user email and put it in the account box
        google.script.run
            .withSuccessHandler(function(email) {
                $(".userEmail").text('Logged in as ' + email);
            })
            .withFailureHandler(function(err) {
                $(".userEmail").text('Error retrieving active account');
            })
            .getUserEmail();
    } catch (err) {
        $(".userEmail").text('Error retrieving active account');
    }
});
