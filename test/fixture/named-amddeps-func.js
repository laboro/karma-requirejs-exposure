define('named-amddeps-func', ['number-four', 'number-three'], function (four, three) {
  'use strict';

  function five () {
    return 5;
  }

  /**
   * @export named-amddeps-func
   */
  return function () {
    return five() + four + three;
  };
});
