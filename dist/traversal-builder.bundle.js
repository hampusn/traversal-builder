/**
 * @file Builder for traversals which can traverse node structures in SiteVision.
 * @author Hampus Nordin <nordin.hampus@gmail.com>
 * @copyright Hampus Nordin 2018
 * @license MIT
 * @module traversalBuilder
 */
/* globals require, module */
(function (root, factory) {
  if (typeof define === 'function') {
    // AMD. Register as an anonymous module.
    define(factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.traversalBuilder = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  var exports = {};

  var nodeTypeUtil        = require('NodeTypeUtil');
  var instanceTypeUtil    = require('InstanceTypeUtil');
  var logUtil             = require('LogUtil');
  var resourceLocatorUtil = require('ResourceLocatorUtil');

  var _recurseTypes    = [
                           nodeTypeUtil.SITE_PAGE_TYPE,
                           nodeTypeUtil.PAGE_TYPE,
                           nodeTypeUtil.ARCHIVE_TYPE,
                           nodeTypeUtil.FOLDER_TYPE
                         ];
  var _acceptTypes     = [
                           nodeTypeUtil.PAGE_TYPE,
                           nodeTypeUtil.ARTICLE_TYPE
                         ];
  var _recurseCallback = null;
  var _acceptCallback  = null;
  var _callback        = null;
  var _denyCallback    = null;
  var _maxDepth        = null;
  var _maxNodes        = 0;

  /**
   * @param  {Mixed} mixed
   * @return {Mixed}
   */
  function castToJs (mixed) {
    try {
      mixed = JSON.parse(JSON.stringify(mixed));
    } catch (e) {
      logUtil.debug(e + '');
    }
    return mixed;
  }

  /**
   * Traversal class
   *
   * @param {Array}    recurseTypes Array of primary node types to traverse recursively.
   * @param {Array}    acceptTypes  Array of primary node types to execute callback on.
   * @param {Function} callback     Callback for accepted nodes.
   * @param {Function} denyCallback Callback for accepted nodes.
   * @param {Integer}  maxDepth     Number of levels to traverse.
   */
  var Traversal = function Traversal (recurseCallback, acceptCallback, callback, denyCallback, maxDepth, maxNodes) {
    this.recurseCallback = recurseCallback;
    this.acceptCallback  = acceptCallback;
    this.callback        = callback;
    this.denyCallback    = denyCallback;
    this.level           = 0;
    this.numNodes        = 0;
    this._break          = false;
    this.maxDepth        = maxDepth;
    this.maxNodes        = maxNodes;
  };

  /**
   * Traversal function for traversing the JCR structure.
   *
   * @param  {Node}  jcrNode A JCR Node. I.e. an article or a page.
   * @param  {Mixed} context Some context passed through to each executed callback.
   * @return {Void}
   */
  Traversal.prototype.traverseJcr = function traverseJcr (jcrNode, context) {
    var nodes;

    if (this._break) {
      return;
    }

    if (this.maxNodes > 0 && this.numNodes >= this.maxNodes) {
      return;
    }

    if (instanceTypeUtil.isNode(jcrNode)) {
      if (this.acceptCallback(jcrNode)) {
        this.callback(jcrNode, context);
        this.numNodes++;
      } else if (typeof this.denyCallback === 'function') {
        this.denyCallback(jcrNode, context);
      }

      if (this.recurseCallback(jcrNode)) {
        this.level++;
        if (!this.maxDepth || this.level <= this.maxDepth) {
          nodes = jcrNode.getNodes();

          while (nodes.hasNext()) {
            this.traverseJcr(nodes.nextNode(), context);
          }
        }
        this.level--;
      }
    }
  };

  /**
   * Main traversal function. Traverses node structures either through JCR structure
   * or through the Rest API.
   *
   * @param  {Node} node The start node to traverse recursively on.
   * @return {Void}
   */
  Traversal.prototype.traverse = function traverse (node, context) {
    this.numNodes = 0;
    this._break = false;

    this.traverseJcr(node, context);
  };

  /**
   * Indicates that the traversal should break and halt further traversing and execution.
   *
   * @return {Void}
   */
  Traversal.prototype.break = function breakTraversal () {
    this._break = true;
  };

  /**
   * Set which primary node types to recurse/traverse on.
   *
   * @param {Array} types Array of strings.
   */
  exports.setRecurseTypes = function setRecurseTypes (types) {
    _recurseTypes = castToJs(Array.isArray(types) ? types : [types]);
    return exports;
  };

  /**
   * Set which primary node types to execute callback on.
   *
   * @param {Array} types Array of strings.
   */
  exports.setAcceptTypes = function setAcceptTypes (types) {
    _acceptTypes = castToJs(Array.isArray(types) ? types : [types]);
    return exports;
  };

  /**
   * Set the callback which will be used to determine if the current node
   * should be traversed or not.
   *
   * This callback will be used instead of the default check of node types.
   *
   * @param {Function} callback
   */
  exports.setRecurseCallback = function setRecurseCallback (callback) {
    _recurseCallback = callback;
    return exports;
  };

  /**
   * Set the callback which will be used to determine if a node is accepted
   * for executing the main callback.
   *
   * This callback will be used instead of the default check of node types.
   *
   * @param {Function} callback
   */
  exports.setAcceptCallback = function setAcceptCallback (callback) {
    _acceptCallback = callback;
    return exports;
  };

  /**
   * Set the callback which will be executed on all
   * traversed nodes matching the accept types.
   *
   * @param {Function} callback
   */
  exports.setCallback = function setCallback (callback) {
    _callback = callback;
    return exports;
  };

  /**
   * Set the callback which will be executed on all
   * traversed nodes matching the accept types.
   *
   * @param {Function} callback
   */
  exports.setDenyCallback = function setDenyCallback (denyCallback) {
    _denyCallback = denyCallback;
    return exports;
  };

  /**
   * Set the max depth to traverse. This is the max amount
   * of times Node.getNodes() will be called recursivly.
   *
   * @param {Integer} maxDepth
   */
  exports.setMaxDepth = function setMaxDepth (maxDepth) {
    _maxDepth = parseInt(maxDepth);
    return exports;
  };

  /**
   * Set the max number of nodes to execute the callback on.
   *
   * @param {Integer} maxNodes
   */
  exports.setMaxNodes = function setMaxNodes (maxNodes) {
    _maxNodes = parseInt(maxNodes);
    return exports;
  };

  /**
   * Build a traversal object.
   *
   * @return {Traversal}
   */
  exports.build = function build () {
    var recurseCallback = _recurseCallback;
    var acceptCallback = _acceptCallback;

    if (typeof _callback !== 'function') {
      throw new Error('Missing callback.');
    }
    if (_recurseTypes.length === 0 && typeof recurseCallback !== 'function') {
      throw new Error('Missing recurse types.');
    }
    if (_acceptTypes.length === 0 && typeof acceptCallback !== 'function') {
      throw new Error('Missing accept types.');
    }

    if (typeof recurseCallback !== 'function') {
      recurseCallback = function (node) {
        return nodeTypeUtil.isTypeOf(node, _recurseTypes);
      };
    }

    if (typeof acceptCallback !== 'function') {
      acceptCallback = function (node) {
        return nodeTypeUtil.isTypeOf(node, _acceptTypes);
      };
    }

    return new Traversal(recurseCallback, acceptCallback, _callback, _denyCallback, _maxDepth, _maxNodes);
  };

  return exports;
}));