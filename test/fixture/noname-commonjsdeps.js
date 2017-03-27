define(function (require) {
  'use strict';

  var five = 5;
  var four = require('number-four');
  var tree = require('number-tree');

  /**
   * @export noname-commonjsdeps
   */
  return function () {
    return five + four + tree;
  };
});
