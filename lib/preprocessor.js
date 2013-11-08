var _ = require('lodash');
var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require('escodegen');

var defaultConfig = {
  namespace: '__ns__'
};
var INJECTION = 'require.exec("contexts._.defined")["%module_name%/exposure"]=' +
  '(function(){' +
    'var %namespace%={};' +
    'return new (require("requirejs-exposure"))(function(expr){return eval(expr)});' +
  '}());';

/**
 * Checks if the node is a 'use strict' statement
 *
 * @param {Object} node
 * @returns {boolean}
 */
function isUseStrict(node) {
  return node.type === 'ExpressionStatement' &&
    _.isEqual(node.expression, {type: 'Literal', value: 'use strict'});
}

/**
 * Parses module content and injects exposure code
 *
 * @param {string} content
 * @param {object} options
 * @returns {string}
 */
function injectExposure(content, options) {
  var parsed = esprima.parse(content);
  var injection = INJECTION
    .replace(/%module_name%/g, options.moduleName)
    .replace(/%namespace%/g, options.namespace);
  var dependency = {type: 'Literal', value: 'requirejs-exposure'};

  estraverse.traverse(parsed, {
    enter: function (node, parent) {
      if (node.type === 'CallExpression' && node.callee.name === 'define' ) {
        var nameNode = _.find(node.arguments, {type: 'Literal'});
        var dependencyNode = _.find(node.arguments, {type: 'ArrayExpression'});
        var callbackNode = _.find(node.arguments, {type: 'FunctionExpression'});

        if (callbackNode) {
          // modifies definition callback
          injection = esprima.parse(injection).body;
          if (isUseStrict(callbackNode.body.body[0])) {
            callbackNode.body.body = callbackNode.body.body.slice(0, 1)
              .concat(injection)
              .concat(callbackNode.body.body.slice(1));
          } else {
            callbackNode.body.body = injection.concat(callbackNode.body.body);
          }

          // add dependency on requirejs-exposure module
          if (dependencyNode) {
            dependencyNode.elements.push(dependency);
          } else {
            dependencyNode = {type: 'ArrayExpression', elements: [dependency]};
          }

          node.arguments = _.filter([nameNode, dependencyNode, callbackNode]);
        }
        return estraverse.VisitorOption.Break;

      } else if (node.type !== 'Program' && node.type !== 'ExpressionStatement') {
        return estraverse.VisitorOption.Skip;

      } else {
        return null;
      }
    }
  });

  return escodegen.generate(parsed);
}

var exposurePreprocessor = function (config) {
  config.requirejsExposure = _.extend({}, defaultConfig, config.requirejsExposure || {}) ;
  return function (content, file, done) {
    // @todo find better solution to define module name (get rid of dependency on JSDoc notation)
    var moduleName = (content.match(/\s@export\s+(\S+)/) || [])[1];
    if (moduleName) {
      content = injectExposure(content, _.extend({}, config.requirejsExposure, {moduleName: moduleName}));
    }
    done(content);
  };
};

exposurePreprocessor.$inject = ['config.client'];

module.exports = exposurePreprocessor;
