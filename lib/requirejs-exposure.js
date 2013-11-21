/* global define */
/* jshint browser:true */
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
   */
  var Exposure = function (obj) {
    this.obj = obj;
    this.ns = {};
  };

  Exposure.prototype = {
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
      return this.obj['get' + variable]();
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
      this.ns[variable] = this.obj['get' + variable]();
    },

    /**
     * Does a rollback to original value for variable
     *
     * @param {string} variable - name of variable
     */
    recover: function (variable) {
      if (this.ns.hasOwnProperty(variable)) {
        this.obj['set' + variable](this.ns[variable]);
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
        by: function(value){
          self.obj['set' + variable](value);
        }
      };
    }
  };

  return {
    register: function (moduleName, obj) {
      modules[moduleName] = new Exposure(obj);
    },
    disclose: function (moduleName) {
      return modules[moduleName];
    }
  };
});
