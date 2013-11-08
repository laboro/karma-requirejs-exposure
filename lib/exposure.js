/* global define */
/* jshint browser:true */
define('requirejs-exposure', function () {
  'use strict';

  /**
   * Name of transfer-object
   * @type {string}
   */
  var ns =  window.__karma__.config.requirejsExposure.namespace;

  /**
   * Transmits value of variable from transfer-object to private scope
   *
   * @param {string} variable - name of variable which have to be transferred to private scope
   * @param {string=} key - property of transfer-object, by default it's same as variable name
   * @this Exposure
   * @private
   */
  function transmit(variable, key) {
    this.module(variable + ' = ' + ns + '["' + (key || variable) + '"]');
  }

  /**
   * Wrapper over exposure module, provides API for private data manipulation
   *
   * @param {Function} module - exposure requirejs module
   */
  var Exposure = function (module) {
    /** @type {Function} */
    this.module = module;
    /** @type {Object} transfer-object which exists in both scopes */
    this.ns = module(ns);
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
      return this.module(variable);
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
      this.ns[variable] = this.module(variable);
    },

    /**
     * Does a rollback to original value for variable
     *
     * @param {string} variable - name of variable
     */
    recover: function (variable) {
      if (this.ns.hasOwnProperty(variable)) {
        transmit.call(this, variable);
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
          var hash = Math.random().toString(36).substring(7);
          self.ns[hash] = value;
          transmit.call(self, variable, hash);
          delete self.ns[hash];
        }
      };
    }
  };

  return Exposure;
});
