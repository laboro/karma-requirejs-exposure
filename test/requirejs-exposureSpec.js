/* global __globalDefinitionContext__, definitionUtils */
var path = require('path');
var fs = require('fs');
var using = require('jasmine-data-provider');
var preprocessor = require('../src/preprocessor')();
var modulesToExpose = {
  'named-amddeps': fs.readFileSync(path.join(__dirname, '/fixture/named-amddeps.js'), 'utf8'),
  'named-commonjsdeps': fs.readFileSync(path.join(__dirname, '/fixture/named-commonjsdeps.js'), 'utf8'),
  'named-nodeps': fs.readFileSync(path.join(__dirname, '/fixture/named-nodeps.js'), 'utf8'),
  'named-nodeps-nostrict': fs.readFileSync(path.join(__dirname, '/fixture/named-nodeps-nostrict.js'), 'utf8'),
  'noname-amddeps': fs.readFileSync(path.join(__dirname, '/fixture/noname-amddeps.js'), 'utf8'),
  'noname-commonjsdeps': fs.readFileSync(path.join(__dirname, '/fixture/noname-commonjsdeps.js'), 'utf8'),
  'noname-nodeps': fs.readFileSync(path.join(__dirname, '/fixture/noname-nodeps.js'), 'utf8')
};
var modulesToIgnore = {
  'named-nodeps-noexport': fs.readFileSync(path.join(__dirname, '/fixture/named-nodeps-noexport.js'), 'utf8'),
  'noname-nodeps-noexport': fs.readFileSync(path.join(__dirname, '/fixture/noname-nodeps-noexport.js'), 'utf8')
};
var moduleFuncExpose = {
  name: 'named-amddeps-func',
  definition: fs.readFileSync(path.join(__dirname, '/fixture/named-amddeps-func.js'), 'utf8')
};

function prepareContext (moduleName, moduleDefinition, callback) {
  preprocessor(moduleDefinition, '', function (changedModuleDefinition) {
    var context = __globalDefinitionContext__.newDescendantContext();
    var bindArgs = [context];
    if (!definitionUtils.isNamed(moduleDefinition)) {
      bindArgs.push(moduleName);
    }
    var define = context.define.bind.apply(context.define, bindArgs); // eslint-disable-line no-unused-vars
    eval(changedModuleDefinition); // eslint-disable-line no-eval
    callback(context);
  });
}

describe('karma preprocessor', function () {
  using(modulesToIgnore, function (initialModuleDefinition, moduleType) {
    describe('"' + moduleType + '" module ignore', function () {
      var module;
      var exposure;

      beforeEach(function (done) {
        prepareContext(moduleType, initialModuleDefinition, function (context) {
          module = context.require(moduleType);
          exposure = context.require('requirejs-exposure');
          done();
        });
      });

      it('original local values', function () {
        expect(module()).toBe(12);
        expect(exposure.disclose(moduleType)).toBe(undefined);
      });
    });
  });

  using(modulesToExpose, function (initialModuleDefinition, moduleType) {
    describe('"' + moduleType + '" module expose', function () {
      var module;
      var exposedModule;

      beforeEach(function (done) {
        prepareContext(moduleType, initialModuleDefinition, function (context) {
          module = context.require(moduleType);
          exposedModule = context.require('requirejs-exposure').disclose(moduleType);
          done();
        });
      });

      it('original local values', function () {
        expect(exposedModule.retrieve('five')).toBe(5);
        expect(exposedModule.retrieve('four')).toBe(4);
        expect(exposedModule.retrieve('three')).toBe(3);
        expect(module()).toBe(12);
      });

      it('throw error on undefined variables', function () {
        expect(function () { exposedModule.backup('two'); }).toThrow();
        expect(function () { exposedModule.substitute('six'); }).toThrow();
        expect(function () { exposedModule.original('six'); }).toThrow();
      });

      it('throw error on undefined variables', function () {
        expect(function () { exposedModule.recover('two'); }).not.toThrow();
      });

      describe('local values substitution', function () {
        beforeEach(function () {
          exposedModule.substitute('five').by(3);
          exposedModule.substitute('four').by(2);
          exposedModule.substitute('three').by(1);
        });

        it('check current values', function () {
          expect(exposedModule.retrieve('five')).toBe(3);
          expect(exposedModule.retrieve('four')).toBe(2);
          expect(exposedModule.retrieve('three')).toBe(1);
          exposedModule.substitute('five').by(9);
          exposedModule.substitute('four').by(8);
          exposedModule.substitute('three').by(7);
          expect(exposedModule.retrieve('five')).toBe(9);
          expect(exposedModule.retrieve('four')).toBe(8);
          expect(exposedModule.retrieve('three')).toBe(7);
        });

        it('check original values', function () {
          expect(exposedModule.original('five')).toBe(5);
          expect(exposedModule.original('four')).toBe(4);
          expect(exposedModule.original('three')).toBe(3);
        });

        it('affects module', function () {
          expect(module()).toBe(6);
        });

        it('recover original values', function () {
          exposedModule.recover('five');
          exposedModule.recover('four');
          exposedModule.recover('three');
          expect(exposedModule.retrieve('five')).toBe(5);
          expect(exposedModule.retrieve('four')).toBe(4);
          expect(exposedModule.retrieve('three')).toBe(3);
          expect(module()).toBe(12);
        });
      });
    });
  });

  describe('"' + moduleFuncExpose.name + '" module expose', function () {
    var moduleType = moduleFuncExpose.name;
    var module;
    var exposedModule;

    beforeEach(function (done) {
      prepareContext(moduleType, moduleFuncExpose.definition, function (context) {
        module = context.require(moduleType);
        exposedModule = context.require('requirejs-exposure').disclose(moduleType);
        done();
      });
    });

    it('original local values', function () {
      expect(exposedModule.retrieve('five')).toEqual(jasmine.any(Function));
      expect(module()).toBe(12);
    });

    describe('local values substitution', function () {
      var func;
      var origFunc;

      beforeEach(function () {
        func = function seven () { return 7; };
        origFunc = exposedModule.retrieve('five');
        exposedModule.substitute('five').by(func);
      });

      it('check current values', function () {
        expect(exposedModule.retrieve('five')).toBe(func);
      });

      it('check original values', function () {
        expect(exposedModule.original('five')).toBe(origFunc);
      });

      it('affects module', function () {
        expect(module()).toBe(14);
      });

      it('recover original values', function () {
        exposedModule.recover('five');
        expect(exposedModule.retrieve('five')).toBe(origFunc);
        expect(module()).toBe(12);
      });
    });
  });
});
