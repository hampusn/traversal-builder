/* globals require, module */
(function (root, factory) {
  if (typeof define === 'function') {
    // AMD. Register as an anonymous module.
    define(factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require);
  } else {
    // Browser globals (root is window)
    root.traversalBuilder_Builder = factory(require);
  }
}(typeof self !== 'undefined' ? self : this, function (require) {

  const nodeTypeUtil = require('NodeTypeUtil');
  const logUtil = require('LogUtil');
  const Traversal = require('./traversal');

  function castToJs (mixed) {
    try {
      mixed = JSON.parse(JSON.stringify(mixed));
    } catch (e) {
      logUtil.debug(e + '');
    }
    return mixed;
  }

  const DEFAULT_RECURSE_TYPES = [
    nodeTypeUtil.SITE_PAGE_TYPE,
    nodeTypeUtil.PAGE_TYPE,
    nodeTypeUtil.ARCHIVE_TYPE,
    nodeTypeUtil.FOLDER_TYPE
  ];

  const DEFAULT_ACCEPT_TYPES = [
    nodeTypeUtil.PAGE_TYPE,
    nodeTypeUtil.ARTICLE_TYPE
  ];

  class Builder {
    constructor () {
      this.recurseTypes = DEFAULT_RECURSE_TYPES;
      this.acceptTypes = DEFAULT_ACCEPT_TYPES;
      this.recurseCallback = null;
      this.acceptCallback = null;
      this.callback = null;
      this.denyCallback = null;
      this.maxDepth = null;
      this.maxNodes = 0;
    }

    /**
     * Set which primary node types to recurse/traverse on.
     *
     * @param {Array} types Array of strings.
     * @returns {Builder} Returns self for chainability.
     */
    setRecurseTypes (types) {
      this.recurseTypes = castToJs(Array.isArray(types) ? types : [types]);
      return this;
    }

    /**
     * Resets the primary node types to recurse/traverse on.
     *
     * @returns {Builder} Returns self for chainability.
     */
    resetRecurseTypes () {
      this.recurseTypes = DEFAULT_RECURSE_TYPES;
      return this;
    }

    /**
     * Set which primary node types to execute callback on.
     *
     * @param {Array} types Array of strings.
     * @returns {Builder} Returns self for chainability.
     */
    setAcceptTypes (types) {
      this.acceptTypes = castToJs(Array.isArray(types) ? types : [types]);
      return this;
    }

    /**
     * Resets the primary node types to execute callback on.
     *
     * @returns {Builder} Returns self for chainability.
     */
    resetAcceptTypes () {
      this.acceptTypes = DEFAULT_ACCEPT_TYPES;
      return this;
    }

    /**
     * Set the callback which will be used to determine if the current node
     * should be traversed or not.
     *
     * This callback will be used instead of the default check of node types.
     *
     * @param {Function} callback
     * @returns {Builder} Returns self for chainability.
     */
    setRecurseCallback (callback) {
      this.recurseCallback = callback;
      return this;
    }

    /**
     * Unsets the recurse callback.
     *
     * @returns {Builder} Returns self for chainability.
     */
    clearRecurseCallback () {
      this.recurseCallback = null;
      return this;
    }

    /**
     * Set the callback which will be used to determine if a node is accepted
     * for executing the main callback.
     *
     * This callback will be used instead of the default check of node types.
     *
     * @param {Function} callback
     * @returns {Builder} Returns self for chainability.
     */
    setAcceptCallback (callback) {
      this.acceptCallback = callback;
      return this;
    }

    /**
     * Unsets the accept callback.
     *
     * @returns {Builder} Returns self for chainability.
     */
    clearAcceptCallback () {
      this.acceptCallback = null;
      return this;
    }

    /**
     * Set the callback which will be executed on all
     * traversed nodes matching the accept types.
     *
     * @param {Function} callback
     * @returns {Builder} Returns self for chainability.
     */
    setCallback (callback) {
      this.callback = callback;
      return this;
    }

    /**
     * Set the callback which will be executed on all
     * traversed nodes matching the accept types.
     *
     * @param {Function} callback
     * @returns {Builder} Returns self for chainability.
     */
    setDenyCallback (denyCallback) {
      this.denyCallback = denyCallback;
      return this;
    }

    /**
     * Unsets the deny callback.
     *
     * @returns {Builder} Returns self for chainability.
     */
    clearDenyCallback () {
      this.denyCallback = null;
      return this;
    }

    /**
     * Set the max depth to traverse. This is the max amount
     * of times Node.getNodes() will be called recursivly.
     *
     * @param {Integer} maxDepth
     * @returns {Builder} Returns self for chainability.
     */
    setMaxDepth (maxDepth) {
      this.maxDepth = parseInt(maxDepth);
      return this;
    }

    /**
     * Unsets the max depth.
     *
     * @returns {Builder} Returns self for chainability.
     */
    clearMaxDepth () {
      this.maxDepth = null;
      return this;
    }

    /**
     * Set the max number of nodes to execute the callback on.
     *
     * @param {Integer} maxNodes
     * @returns {Builder} Returns self for chainability.
     */
    setMaxNodes (maxNodes) {
      this.maxNodes = parseInt(maxNodes);
      return this;
    }

    /**
     * Resets the max nodes.
     *
     * @returns {Builder} Returns self for chainability.
     */
    resetMaxNodes () {
      this.maxNodes = 0;
      return this;
    }

    /**
     * Resets and clears all optionals.
     *
     * @returns {Builder} Returns self for chainability.
     */
    resetAllOptionals () {
      return this
        .resetRecurseTypes()
        .resetAcceptTypes()
        .clearRecurseCallback()
        .clearAcceptCallback()
        .clearDenyCallback()
        .clearMaxDepth()
        .resetMaxNodes();
    }

    /**
     * Build a traversal object.
     *
     * @return {Traversal}
     */
    build () {
      let recurseCallback = this.recurseCallback;
      let acceptCallback = this.acceptCallback;

      try {
        if (typeof this.callback !== 'function') {
          throw new Error('Missing callback.');
        }
        if (this.recurseTypes.length === 0 && typeof recurseCallback !== 'function') {
          throw new Error('Missing recurse types.');
        }
        if (this.acceptTypes.length === 0 && typeof acceptCallback !== 'function') {
          throw new Error('Missing accept types.');
        }

        if (typeof recurseCallback !== 'function') {
          recurseCallback = (node) => {
            return nodeTypeUtil.isTypeOf(node, this.recurseTypes);
          };
        }

        if (typeof acceptCallback !== 'function') {
          acceptCallback = (node) => {
            return nodeTypeUtil.isTypeOf(node, this.acceptTypes);
          };
        }
      } catch (e) {
        logUtil.warn(e);
        throw e;
      }

      return new Traversal(recurseCallback, acceptCallback, this.callback, this.denyCallback, this.maxDepth, this.maxNodes);
    }
  }

  return Builder;
}));