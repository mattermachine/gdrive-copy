// Thanks to http://callmenick.com/post/simple-responsive-tabs-javascript-css

'use strict';

/**
 * tabs
 *
 * @description The Tabs component.
 * @param {Object} options The options hash
 */

module.exports = function(options) {
  var tabNavigationLinks = document.querySelectorAll(
    options.tabNavigationLinks
  );
  var tabContentContainers = document.querySelectorAll(
    options.tabContentContainers
  );
  var activeIndex = 0;

  /**
   * init
   *
   * @description Initializes the component by removing the no-js class from
   *   the component, and attaching event listeners to each of the nav items.
   *   Returns nothing.
   */
  var init = function() {
    for (var i = 0; i < tabNavigationLinks.length; i++) {
      var link = tabNavigationLinks[i];
      handleClick(link, i);
    }

    // Go to the "start" tab.  About is 0, Start is 1
    goToTab(1);
  };

  /**
   * handleClick
   *
   * @description Handles click event listeners on each of the links in the
   *   tab navigation. Returns nothing.
   * @param {HTMLElement} link The link to listen for events on
   * @param {Number} index The index of that link
   */
  var handleClick = function(link, index) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      goToTab(index);
    });
  };

  /**
   * goToTab
   *
   * @description Goes to a specific tab based on index. Returns nothing.
   * @param {Number} index The index of the tab to go to
   */
  var goToTab = function(index) {
    if (
      index !== activeIndex &&
      index >= 0 &&
      index <= tabNavigationLinks.length
    ) {
      tabNavigationLinks[activeIndex].classList.remove('active');
      tabNavigationLinks[index].classList.add('active');
      tabContentContainers[activeIndex].classList.remove('active');
      tabContentContainers[index].classList.add('active');
      activeIndex = index;
    }
  };

  /**
   * Returns init and goToTab
   */
  return {
    init: init,
    goToTab: goToTab
  };
};
