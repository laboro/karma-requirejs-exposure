define('named-nodeps-nostrict', function () {
  var five = 5;
  var four = 4;
  var three = 3;

  /**
   * @export named-nodeps-nostrict
   */
  return function () {
    return five + four + three;
  };
});
