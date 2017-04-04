define('named-amddeps', ['number-four', 'number-three'], function (four, three) {
  'use strict';

  var five = 5;

  /**
   * @export named-amddeps
   */
  return function () {
    return five + four + three;
  };
});
