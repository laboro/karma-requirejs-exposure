define('named-nodeps-noexport', function () {
  'use strict';

  var five = 5;
  var four = 4;
  var three = 3;

  return function () {
    return five + four + three;
  };
});
