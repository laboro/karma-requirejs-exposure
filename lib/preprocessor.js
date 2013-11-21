var _ = require('lodash');
var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require('escodegen');
var fs = require('fs');

var tmpl = __dirname + '/injection.tmpl';
var injectionTmpl = _.template(fs.readFileSync(tmpl, {encoding: 'utf8'}));

/**
 * Generates exposure code and injects is into definition callback body
 *
 * @param {string} moduleName
 * @param {Object} dependency
 * @param {Object} callback
 */
function modifyDefinition (moduleName, dependency, callback) {
  var vars = getVars(callback);
  var injection = injectionTmpl({module: moduleName, vars: vars});
  injection = esprima.parse(injection).body[0];
  if (isUseStrict(callback.body.body[0])) {
    callback.body.body.splice(1, 0, injection);
  } else {
    callback.body.body = [injection].concat(callback.body.body);
  }
  var index = callback.params.push({type: 'Identifier', name: 'requirejsExposure'});
  dependency.elements.splice(index - 1, 0, {type: 'Literal', value: 'requirejs-exposure'});
}

/**
 * Checks if the node is a 'use strict' statement
 *
 * @param {Object|undefined} node
 * @returns {boolean}
 */
function isUseStrict (node) {
  return node && node.type === 'ExpressionStatement' &&
    _.isEqual(node.expression, {type: 'Literal', value: 'use strict'});
}

/**
 * Goes across parsed code and collects definition function calls
 * such as define(), require() or requirejs()
 *
 * @param {Object} parsed
 * @returns {Array}
 */
function getDefinitions(parsed) {
  var result = [];
  estraverse.traverse(parsed, {
    enter: function (node, parent) {
      var callback, dependency, moduleName;
      if (node.type === 'CallExpression' && _.contains(['define', 'require', 'requirejs'], node.callee.name)) {
        moduleName = _.find(node['arguments'], {type: 'Literal'});
        dependency = _.find(node['arguments'], {type: 'ArrayExpression'});
        callback = _.find(node['arguments'], {type: 'FunctionExpression'});
        if (callback) {
          if (!dependency) {
            // if module has no dependency, create empty array node and append it before callback argument
            dependency = {type: 'ArrayExpression', elements: []};
            node['arguments'].splice(node['arguments'].indexOf(callback), 0, dependency);
          }
          result.push([moduleName, dependency, callback]);
        }
        return estraverse.VisitorOption.Skip;

      } else if (node.type !== 'Program' && node.type !== 'ExpressionStatement') {
        return estraverse.VisitorOption.Skip;

      } else {
          return null;
      }
    }
  });
  return result;
}

/**
 * Collects names which should be exposed (arguments, vars and function)
 *
 * @param {Object} parsed
 * @returns {Array.<string>}
 */
function getVars(parsed) {
  // collect passed arguments
  var names = _.map(parsed.params, function (param) {
      return param.name;
  });

  estraverse.traverse(parsed, {
    enter: function (node, parent) {
      var nodes;
      // collect function declaration
      if (node.type === 'FunctionDeclaration') {
        names.push(node.id.name);
        return estraverse.VisitorOption.Skip;

        // collect variable declaration
      } else if (node.type === 'VariableDeclaration') {
        nodes = _.filter(node.declarations, {type: 'VariableDeclarator'});
        names.push.apply(names, _.map(nodes, function (node) {
          return node.id.name;
        }));
        return estraverse.VisitorOption.Skip;

      } else if (node.type !== 'FunctionExpression' && node.type !== 'BlockStatement') {
        return estraverse.VisitorOption.Skip;

      } else {
        return null;
      }
    }
  });

  return names;
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
  var moduleName = options.moduleName;
    _.each(getDefinitions(parsed), function (args, i) {
      // if file has several definition calls, makes unique module name
      args[0] = (args[0] && args[0].value) || (moduleName + (i || '')) ;
      modifyDefinition.apply(null, args);
    });
    try {
      content = escodegen.generate(parsed);
    } catch (e) {
      console.error('Error occurred during exposure injection to "' + moduleName + "\"\n", e.stack);
    }
  return content;
}

var exposurePreprocessor = function () {
  return function (content, file, done) {
    // @todo find better solution to define module name (get rid of dependency on JSDoc notation)
    var moduleName = (content.match(/\s@export\s+(\S+)/) || [])[1];
    if (moduleName) {
      content = injectExposure(content, {moduleName: moduleName});
    }
    done(content);
  };
};

exposurePreprocessor.$inject = ['config.client'];

module.exports = exposurePreprocessor;
