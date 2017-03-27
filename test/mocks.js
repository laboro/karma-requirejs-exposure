Object.setPrototypeOf = Object.setPrototypeOf || function (obj, proto) {
  // polyfill for PhantomJS
  obj.__proto__ = proto; // eslint-disable-line  no-proto
  return obj;
};

function DefinitionContext () {
  var newContext = function () {
    var context = Object.setPrototypeOf({}, this);
    context.modules = {};
    context.newDescendantContext = newContext.bind(context);
    return context;
  };
  this.modules = {};
  this.newDescendantContext = newContext.bind(this);
}

DefinitionContext.isAMD = function (callback) {
  return !callback.toString().match(/^function\s*\(\s*require\s*\)\s*\{\s*/);
};

DefinitionContext.prototype.constructor = DefinitionContext;
DefinitionContext.prototype.require = function (name) {
  // name have not to be 'require', 'define' or 'modules'
  return this[name];
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

  Object.defineProperty(this, name, {
    get: function () {
      var module;
      var depsModules;
      var require;
      if (name in this.modules) {
        module = this.modules[name];
      } else {
        require = this.require.bind(this);
        if (DefinitionContext.isAMD(callback)) {
          depsModules = deps ? deps.map(require) : null;
        } else {
          depsModules = [require];
        }
        module = this.modules[name] = callback.apply(null, depsModules);
      }
      return module;
    }
  });
};

var __globalDefinitionContext__ = new DefinitionContext();
var define = __globalDefinitionContext__.define.bind(__globalDefinitionContext__); // eslint-disable-line no-unused-vars
