Object.setPrototypeOf = Object.setPrototypeOf || function (obj, proto) {
  // polyfill for PhantomJS
  obj.__proto__ = proto; // eslint-disable-line  no-proto
  return obj;
};

var definitionUtils = {
  /**
   * Check if module definition callback function is in AMD format
   *
   * @param {function} definitionCallback
   * @returns {boolean}
   */
  isAMD: function (definitionCallback) {
    return !definitionCallback.toString()
      .match(/^function\s*\(\s*require\s*(,\s*exports\s*(,\s*module\s*)?)?\)\s*{\s*/);
  },

  /**
   * Check if module has a name in its definition
   *
   * @param {string} moduleDefinition source code of module definition
   * @returns {boolean}
   */
  isNamed: function (moduleDefinition) {
    return moduleDefinition
      .match(/define\(\s*'[\w\-_\/]+'\s*,/);
  }
};

function DefinitionContext () {
  this._modules = {};
  this._definitions = {};
  this.newDescendantContext = function () {
    var context = Object.setPrototypeOf({parentContext: this}, this);
    return DefinitionContext.call(context);
  };
  return this;
}

DefinitionContext.prototype.constructor = DefinitionContext;

DefinitionContext.prototype.require = function (name) {
  var module;
  if (name in this._modules) {
    // if module is already built
    module = this._modules[name];
  } else {
    // build module from definition and store it in current context
    var definition = this._getDefinition(name);
    module = this._modules[name] = definition(this.require.bind(this));
  }
  return module;
};

DefinitionContext.prototype._getDefinition = function (name) {
  var definition;
  if (name in this._definitions) {
    definition = this._definitions[name];
  } else if (this.parentContext) {
    definition = this.parentContext._getDefinition(name);
  }
  if (!definition) {
    throw new Error('Module "' + name + '" is not defined yet');
  }
  return definition;
};

DefinitionContext.prototype.define = function (name, deps, callback) {
  // Allow for anonymous modules
  if (typeof name !== 'string') {
    // Adjust args appropriately
    callback = deps;
    deps = name;
    name = null;
  }

  // This module may not have dependencies
  if (!(deps instanceof Array)) {
    callback = deps;
    deps = null;
  }

  name = name || (callback.toString().match(/\s@export\s+(\S+)/) || [])[1];

  this._definitions[name] = function (require) {
    var depsModules;
    if (definitionUtils.isAMD(callback)) {
      depsModules = deps ? deps.map(require) : null;
    } else {
      depsModules = [require];
    }
    return callback.apply(null, depsModules);
  };
};

var __globalDefinitionContext__ = new DefinitionContext();
var define = __globalDefinitionContext__.define.bind(__globalDefinitionContext__); // eslint-disable-line no-unused-vars
