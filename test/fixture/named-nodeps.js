define('named-nodeps', function () {
  'use strict';

  var five = 5;
  var four = 4;
  var three = 3;

  /**
   * @export named-nodeps
   */
  return function () {
    return five + four + three;
  };
});
