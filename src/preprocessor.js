var _ = require('lodash');
var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require('escodegen');
var path = require('path');
var fs = require('fs');

var injectionTmpl = _.template(fs.readFileSync(path.join(__dirname, '/injection.tmpl'), 'utf8'));
var commonJSArgs = esprima.parse('function mock (require, exports, module) {}').body[0].params;

/**
 * Generates exposure code and injects is into definition callback body
 *
 * @param {string} annotatedModuleName module name that is defined in module's annotation
 * @param {Object} declarationNode
 * @param {int} i index of declaration
 */
function modifyDefinition (annotatedModuleName, declarationNode, i) {
  var index, injectionLine, injectionCode;
  var moduleName = _.find(declarationNode.arguments, {type: 'Literal'});
  var dependency = _.find(declarationNode.arguments, {type: 'ArrayExpression'});
  var callback = _.find(declarationNode.arguments, {type: 'FunctionExpression'});
  var data = {
    // if file has several definition calls, makes unique module name
    module: (moduleName && moduleName.value) || (annotatedModuleName + (i || '')),
    vars: getVars(callback),
    isAMD: dependency || isAMD(callback)
  };

  if (data.isAMD) {
    index = callback.params.push({type: 'Identifier', name: 'requirejsExposure'});
    if (!dependency) {
      // if module has no dependency, create empty array node
      dependency = {type: 'ArrayExpression', elements: []};
      declarationNode.arguments.splice(declarationNode.arguments.indexOf(callback), 0, dependency);
    }
    dependency.elements.splice(index - 1, 0, {type: 'Literal', value: 'requirejs-exposure'});
  }

  injectionLine = isUseStrict(callback.body.body[0]) ? 1 : 0;
  injectionCode = injectionTmpl(data);
  callback.body.body.splice(injectionLine, 0, esprima.parse(injectionCode).body[0]);
}

/**
 * Check if module definition is in AMD format
 *
 * @param {Object} callback node of parsed module definition function
 * @returns {boolean}
 */
function isAMD (callback) {
  var params = callback.params;
  return params.length === 0 ||
    _.differenceWith(params, commonJSArgs.slice(0, params.length), _.isEqual).length > 0;
}

/**
 * Checks if the node is a 'use strict' statement
 *
 * @param {Object|undefined} node
 * @returns {boolean}
 */
function isUseStrict (node) {
  return node && node.type === 'ExpressionStatement' &&
    _.isMatch(node.expression, {type: 'Literal', value: 'use strict'});
}

/**
 * Goes across parsed code and collects definition function calls
 * such as define(), require() or requirejs()
 *
 * @param {Object} parsed
 * @returns {Array} list of nodes with module declaration
 */
function getDefinitionNodes (parsed) {
  var result = [];
  estraverse.traverse(parsed, {
    enter: function (node) {
      if (node.type === 'CallExpression' && _.includes(['define', 'require', 'requirejs'], node.callee.name)) {
        result.push(node);
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
function getVars (parsed) {
  // collect passed arguments
  var names = _.map(parsed.params, function (param) {
    return param.name;
  });

  estraverse.traverse(parsed, {
    enter: function (node) {
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
function injectExposure (content, options) {
  var parsed = esprima.parse(content);
  var moduleName = options.moduleName;
  _.each(getDefinitionNodes(parsed), _.partial(modifyDefinition, moduleName));
  try {
    content = escodegen.generate(parsed);
  } catch (e) {
    console.error('Error occurred during exposure injection to "' + moduleName + '"\n', e.stack);
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
