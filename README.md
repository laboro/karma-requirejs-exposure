# karma-requirejs-exposure

> Karma's plugin which allows to test private functional of AMD-modules

Contains:
 - Preprocessor, which looks through module content for ```@export %module_name%``` JSDoc notation and (if it exists) injects piece of code into module definition callback.
 - Client lib allows to get access to private variable and functions from spec.

## Installation
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

    plugins: [
      'karma-requirejs',
      'karma-jasmine',
      'karma-phantomjs-launcher',
      'karma-requirejs-exposure'
    ]
  });
};
```

## Example
Let's take `some/module.js` module:
```js
define(function () {
  var foo = {};
  foo.do = function () {};

  /**
   * @export some/module
   */
  return {
    doSomething: function () {
      foo.do();
    }
  };
});
```

And try to test private `foo` object. [Jasmine](http://jasmine.github.io/) spec for that module will be:
```js
define(['some/module', 'requirejs-exposure'],
function(module, requirejsExposure) {
  // get exposure instance for tested module
  var exposure = requirejsExposure.disclose('some/module');

  describe('some/module', function () {
    var foo;
    // save original value of foo variable
    exposure.backup('foo');

    beforeEach(function () {
      // create mock object with stub method 'do'
      foo = jasmine.createSpyObj('foo', ['do']);
      // before each test, pass it off instead of original
      exposure.substitute('foo').by(foo);
    });
    afterEach(function () {
        // after each test restore original value of foo
        exposure.recover('foo');
    });

    it('check doSomething() method', function() {
      // private foo object is successfully replaced by mock
      expect(exposure.retrieve('foo')).toBe(foo);
      // mean time, original object is safe
      expect(exposure.retrieve('foo')).not.toBe(exposure.original('foo'));

      module.doSomething();

      // stub method of mock object has been called
      expect(foo.do).toHaveBeenCalled();
      // this is the same as previous assertion
      expect(exposure.retrieve('foo')).toHaveBeenCalled();
      //but original method never touched
      expect(exposure.original('foo')).not.toHaveBeenCalled();
    });
  });
});
```

Also `karma-requirejs-exposure` plugin very useful for mocking depended on modules. It works the same way for any named argument of `define()` callback (as well `require()` and `requirejs()`), private variable or function.
