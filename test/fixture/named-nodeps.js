define('named-nodeps', function () {
  'use strict';

  var five = 5;
  var four = 4;
  var tree = 3;

  /**
   * @export noname-nodeps
   */
  return function () {
    return five + four + tree;
  };
});
