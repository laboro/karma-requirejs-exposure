var createPattern = function(path) {
  return {pattern: path, included: true, served: true, watched: false};
};

var initRequirejsExposure = function(files) {
  files.unshift(createPattern(__dirname + '/requirejs-exposure.js'));
};

initRequirejsExposure.$inject = ['config.files'];

// PUBLISH DI MODULE
module.exports = {
  'framework:requirejs-exposure': ['factory', initRequirejsExposure],
  'preprocessor:requirejs-exposure': ['factory', require('./preprocessor')]
};
