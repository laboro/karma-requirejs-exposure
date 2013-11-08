# karma-requirejs-exposure

> Preprocessor to inject exposure code inside RequireJS module, which allows to test private functional

Preprocessor looks through module content for ```@export %module_name%``` JSDoc notation and (if it exists) injects piece of code into module definition callback, which allows to get access to private variable and functions.

### Installation
Requires Karma 0.9+

To use this with karma, first you will need to install it with npm
```bash
npm install https://github.com/laboro/karma-exposure-preprocessor --save-dev
```    

Next you need to create a configuration file using karma init
```js
// karma.conf.js
module.exports = function(config) {
  config.set({
    frameworks: ['jasmine', 'requirejs-exposure', 'requirejs'],

    preprocessors: {
      '**/*.js': ['requirejs-exposure']
    },

    files: [
      '*.js'
    ],

    client: {
        requirejsExposure: {
            // name of transfer-object, used for exchanging data between scopes of Spec and tested module
            // by default it's __ns__
            namespace: '__ns__'
        }
    },
    
    plugins: [
      'karma-requirejs',
      'karma-jasmine',
      'karma-phantomjs-launcher',
      'karma-requirejs-exposure'
    ]
  });
};
```
