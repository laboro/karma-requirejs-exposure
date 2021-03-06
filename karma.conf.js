var istanbul = require('browserify-istanbul');

module.exports = function (config) {
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine', 'browserify'],

    // list of files / patterns to load in the browser
    files: [
      {pattern: 'src/**/*.js'},
      {pattern: 'test/mocks.js'},
      {pattern: 'dist/*.js'},
      {pattern: 'test/fixture/*.js'},
      {pattern: 'test/**/*Spec.js'}
    ],

    // list of files to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'dist/*.js': ['coverage'],
      'src/*.js': ['coverage', 'browserify'],
      'test/**/*Spec.js': ['browserify']
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],

    coverageReporter: {
      dir: 'build/coverage',
      reporters: [
        {type: 'lcov', subdir: 'report-lcov'}
      ]
    },

    browserify: {
      debug: true,
      transform: [
        'brfs',
        istanbul({irgnore: ['**/node_modules/**']})
      ]
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // report which specs are slower than 500ms
    // CLI --report-slower-than 500
    reportSlowerThan: 500,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    plugins: [
      'karma-jasmine',
      'karma-browserify',
      'karma-coverage',
      'karma-phantomjs-launcher',
      'karma-chrome-launcher'
    ]
  });
};
