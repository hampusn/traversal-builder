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
  var restApi             = require('RestApi');
  var logUtil             = require('LogUtil');
  var resourceLocatorUtil = require('ResourceLocatorUtil');

  var _recurseTypes = [
                        nodeTypeUtil.SITE_PAGE_TYPE,
                        nodeTypeUtil.PAGE_TYPE,
                        nodeTypeUtil.ARCHIVE_TYPE,
                        nodeTypeUtil.FOLDER_TYPE
                      ];
  var _acceptTypes  = [
                        nodeTypeUtil.PAGE_TYPE,
                        nodeTypeUtil.ARTICLE_TYPE
                      ];
  var _callback     = null;
  var _denyCallback = null;
  var _maxDepth     = null;
  var _maxNodes     = 0;
  var _useRestApi   = false;

  /**
   * @param  {jcrNode} jcrNode
   * @return {Object}
   */
  function mockupRestNodeFromJcrNode (jcrNode) {
    return {
      "id": jcrNode.getIdentifier(),
      "name": jcrNode.toString(),
      "type": jcrNode.getPrimaryNodeType(),
      "path": "",
      "properties": []
    };
  }

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
   * @param {Boolean}  useRestApi   Whether or not to use the REST API.
   */
  var Traversal = function Traversal (recurseTypes, acceptTypes, callback, denyCallback, maxDepth, maxNodes, useRestApi) {
    this.recurseTypes = recurseTypes;
    this.acceptTypes  = acceptTypes;
    this.callback     = callback;
    this.denyCallback = denyCallback;
    this.level        = 0;
    this.numNodes     = 0;
    this.break        = false;
    this.maxDepth     = maxDepth;
    this.maxNodes     = maxNodes;
    this.useRestApi   = useRestApi;
  };

  /**
   * Traversal function for traversing through the Rest API.
   *
   * @param  {Object} restNode A node representation as seen in the Rest API.
   * @param  {Mixed}  context  Some context passed through to each executed callback.
   * @return {Void}
   */
  Traversal.prototype.traverseRest = function traverseRest (restNode, context, options) {
    var nodes;
    var result;
    var i;
    options = options || {};

    if (this.break) {
      return;
    }

    if (this.maxNodes > 0 && this.numNodes >= this.maxNodes) {
      return;
    }

    if (restNode && restNode.id && restNode.type) {
      if (this.acceptTypes.indexOf(restNode.type + '') !== -1) {
        this.callback(restNode, context);
        this.numNodes++;
      } else if (typeof this.denyCallback === 'function') {
        this.denyCallback(restNode, context);
      }

      if (this.recurseTypes.indexOf(restNode.type + '') !== -1) {
        this.level++;
        if (!this.maxDepth || this.level <= this.maxDepth) {
          result = restApi.get(resourceLocatorUtil.getNodeByIdentifier(restNode.id), 'nodes', options);
          nodes = (result.statusCode >= 200 && result.statusCode < 300) ? result.body : [];

          for (i = 0; i < nodes.length; i++) {
            this.traverseRest(nodes[i], context, options);
          }
        }
        this.level--;
      }
    }
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

    if (this.break) {
      return;
    }

    if (this.maxNodes > 0 && this.numNodes >= this.maxNodes) {
      return;
    }

    if (instanceTypeUtil.isNode(jcrNode)) {
      if (nodeTypeUtil.isTypeOf(jcrNode, this.acceptTypes)) {
        this.callback(jcrNode, context);
        this.numNodes++;
      } else if (typeof this.denyCallback === 'function') {
        this.denyCallback(jcrNode, context);
      }

      if (nodeTypeUtil.isTypeOf(jcrNode, this.recurseTypes)) {
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
    if (this.useRestApi) {
      this.traverseRest(mockupRestNodeFromJcrNode(node), context);
    } else {
      this.traverseJcr(node, context);
    }
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
   * Set whether to use the REST API or through the regular JCR structure.
   *
   * @param {Boolean} useRestApi
   */
  exports.setUseRestApi = function setUseRestApi (useRestApi) {
    _useRestApi = !!useRestApi;
    return exports;
  };

  /**
   * Build a traversal object.
   *
   * @return {Traversal}
   */
  exports.build = function build () {
    if (typeof _callback !== 'function') {
      throw new Error('Missing callback.');
    }
    if (_recurseTypes.length === 0) {
      throw new Error('Missing recurse types.');
    }
    if (_acceptTypes.length === 0) {
      throw new Error('Missing accept types.');
    }
    return new Traversal(_recurseTypes, _acceptTypes, _callback, _denyCallback, _maxDepth, _maxNodes, _useRestApi);
  };

  return exports;
}));
