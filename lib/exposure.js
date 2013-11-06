var _ = require('lodash');
var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require('escodegen');

var defaultConfig = {
  injection: 'require.exec(\'contexts["_"]["defined"]\')[\'%module_name%/exposure\']=function(expr){return eval(expr)};'
};

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
 * @param {string} moduleName
 * @this {Object} current configuration
 * @returns {string}
 */
function injectExposure(content, moduleName) {
  var parsed = esprima.parse(content),
    injection = esprima.parse(this.injection.replace(/%module_name%/g, moduleName)).body;
  estraverse.traverse(parsed, {
    enter: function (node, parent) {
      if (node.type === 'CallExpression' && node.callee.name === 'define' ) {
        var callbackNode = _.last(node.arguments);
        if (callbackNode.type === 'FunctionExpression') {
          if (isUseStrict(callbackNode.body.body[0])) {
            callbackNode.body.body = callbackNode.body.body.slice(0, 1)
              .concat(injection)
              .concat(callbackNode.body.body.slice(1));
          } else {
            callbackNode.body.body = injection.concat(callbackNode.body.body);
          }
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
  config = _.extend({}, defaultConfig, typeof config === 'object' ? config : {});
  return function (content, file, done) {
    var moduleName = (content.match(/\s@export\s+(\S+)/) || [])[1];
    if (moduleName) {
      content = injectExposure.call(config, content, moduleName);
    }
    done(content);
  };
};

exposurePreprocessor.$inject = ['config.exposurePreprocessor'];

module.exports = exposurePreprocessor;
