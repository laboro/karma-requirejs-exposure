/* global __globalDefinitionContext__ */
var path = require('path');
var fs = require('fs');
var using = require('jasmine-data-provider');
var preprocessor = require('../src/preprocessor')();
var modules = {
  'named-nodeps': fs.readFileSync(path.join(__dirname, '/fixture/named-nodeps.js'), 'utf8'),
  'noname-amddeps': fs.readFileSync(path.join(__dirname, '/fixture/noname-amddeps.js'), 'utf8'),
  // 'noname-commonjsdeps': fs.readFileSync(path.join(__dirname, '/fixture/noname-commonjsdeps.js'), 'utf8'),
  'noname-nodeps': fs.readFileSync(path.join(__dirname, '/fixture/noname-nodeps.js'), 'utf8')
};


describe('karma preprocessor', function () {
  using(modules, function (initialModuleDefinition, moduleType) {
    describe('"' + moduleType + '" module', function () {
      var module;
      var exposedModule;

      beforeEach(function (done) {
        preprocessor(initialModuleDefinition, '', function (changedModuleDefinition) {
          var context = __globalDefinitionContext__.newDescendantContext();
          var bindArgs = [context];
          if (!definitionUtils.isNamed(initialModuleDefinition)) {
            bindArgs.push(moduleType);
          }
          var define = context.define.bind.apply(context.define, bindArgs); // eslint-disable-line no-unused-vars
          eval(changedModuleDefinition); // eslint-disable-line no-eval
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
});
