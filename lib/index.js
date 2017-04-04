var path = require('path');

var createPattern = function (path) {
  return {pattern: path, included: true, served: true, watched: false};
};

var initRequirejsExposure = function (files) {
  files.unshift(createPattern(path.join(__dirname, '/../dist/requirejs-exposure.js')));
};

initRequirejsExposure.$inject = ['config.files'];

// PUBLISH DI MODULE
module.exports = {
  'framework:requirejs-exposure': ['factory', initRequirejsExposure],
  'preprocessor:requirejs-exposure': ['factory', require('./../src/preprocessor')]
};
