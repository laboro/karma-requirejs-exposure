define('requirejs-exposure', function () {
  'use strict';

  /**
   * Registry of modules' Exposure instances
   * @type {Object}
   */
  var modules = {};

  /**
   * Wrapper over exposure module, provides API for private data manipulation
   *
   * @param {Object} obj - exposure requirejs module
   * @param {string} moduleName - name of module
   */
  var Exposure = function (obj, moduleName) {
    this.obj = obj;
    this.ns = {};
    this.moduleName = moduleName;
  };

  Exposure.prototype = {
    _get: function (variable) {
      var getterMethod = 'get' + variable;
      if (typeof this.obj[getterMethod] !== 'function') {
        throw new Error('Module "' + this.moduleName + '" does\'t have local variable "' + variable + '" ');
      }
      return this.obj[getterMethod]();
    },

    _set: function (variable, value) {
      var setterMethod = 'set' + variable;
      this.obj[setterMethod](value);
    },

    /**
     * Fetches value of private variable
     *
     * @param {string} variable - name of variable
     * @returns {*}
     */
    retrieve: function (variable) {
      if (!this.ns.hasOwnProperty(variable)) {
        this.backup(variable);
      }
      return this._get(variable);
    },

    /**
     * Fetches original value of private variable
     *
     * @param {string} variable - name of variable
     * @returns {*}
     */
    original: function (variable) {
      return this.ns.hasOwnProperty(variable) ? this.ns[variable] : this.retrieve(variable);
    },

    /**
     * Stores original value of private variable
     *
     * @param {string} variable - name of variable
     */
    backup: function (variable) {
      this.ns[variable] = this._get(variable);
    },

    /**
     * Does a rollback to original value for variable
     *
     * @param {string} variable - name of variable
     */
    recover: function (variable) {
      if (this.ns.hasOwnProperty(variable)) {
        this._set(variable, this.ns[variable]);
      }
    },

    /**
     * Changes value of variable
     *
     * @param {string} variable - name of variable
     * @returns {{by: function(string)}} function which expects new value for variable
     */
    substitute: function (variable) {
      var self = this;
      if (!this.ns.hasOwnProperty(variable)) {
        this.backup(variable);
      }
      return {
        by: function (value) {
          self._set(variable, value);
        }
      };
    }
  };

  return {
    register: function (moduleName, obj) {
      modules[moduleName] = new Exposure(obj, moduleName);
    },

    disclose: function (moduleName) {
      return modules[moduleName];
    },

    Exposure: Exposure
  };
});
