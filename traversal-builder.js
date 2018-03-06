/**
 * Builder for traversals which can traverse node structures in SiteVision.
 * @return {Object}
 */
var traversalBuilder = (function (exports) {
  var nodeTypeUtil     = require('NodeTypeUtil');
  var instanceTypeUtil = require('InstanceTypeUtil');

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
  var _maxDepth     = null;

  /**
   * Traversal class
   *
   * @param {Array}    recurseTypes Array of primary node types to traverse recursively.
   * @param {Array}    acceptTypes  Array of primary node types to execute callback on.
   * @param {Function} callback     Callback for accepted nodes.
   * @param {Integer}  maxDepth     Number of levels to traverse.
   */
  var Traversal = function Traversal (recurseTypes, acceptTypes, callback, maxDepth) {
    this.recurseTypes = recurseTypes;
    this.acceptTypes  = acceptTypes;
    this.callback     = callback;
    this.level        = 0;
    this.maxDepth     = maxDepth;
  };

  /**
   * Main traversal function. Traverses node structures.
   *
   * @param  {Node} node The start node to traverse recursively on.
   * @return {Void}
   */
  Traversal.prototype.traverse = function traverse (node) {
    var nodes;

    if (instanceTypeUtil.isNode(node)) {
      if (nodeTypeUtil.isTypeOf(node, this.acceptTypes)) {
        this.callback(node);
      }

      if (nodeTypeUtil.isTypeOf(node, this.recurseTypes)) {
        nodes = node.getNodes();

        this.level++;
        if (!this.maxDepth || this.level <= this.maxDepth) {
          while (nodes.hasNext()) {
            this.traverse(nodes.nextNode());
          }
        }
        this.level--;
      }
    }
  };

  /**
   * Set which primary node types to recurse/traverse on.
   *
   * @param {Array} types Array of strings.
   */
  exports.setRecurseTypes = function setRecurseTypes (types) {
    _recurseTypes = Array.isArray(types) ? types : [types];
    return exports;
  };

  /**
   * Set which primary node types to execute callback on.
   *
   * @param {Array} types Array of strings.
   */
  exports.setAcceptTypes = function setAcceptTypes (types) {
    _acceptTypes = Array.isArray(types) ? types : [types];
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
   * Build a traversal object.
   *
   * @return {traversal}
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
    return new Traversal(_recurseTypes, _acceptTypes, _callback, _maxDepth);
  };

  return exports;
})({});