define(function (require) {
  'use strict';

  var five = 5;
  var four = require('number-four');
  var three = require('number-three');

  /**
   * @export noname-commonjsdeps
   */
  return function () {
    return five + four + three;
  };
});
