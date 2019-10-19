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
    root.traversalBuilder_Traversal = factory(require);
  }
}(typeof self !== 'undefined' ? self : this, function (require) {

  const instanceTypeUtil = require('InstanceTypeUtil');

  class Traversal {
    /**
     * Constructor
     *
     * @param {Function} recurseCallback Callback for ...
     * @param {Function} acceptCallback  Callback for ...
     * @param {Function} callback        Callback for accepted nodes.
     * @param {Function} denyCallback    Callback for accepted nodes.
     * @param {Integer}  maxDepth        Number of levels to traverse.
     * @param {Integer}  maxNodes        Max number of nodes to execute on.
     */
    constructor (recurseCallback, acceptCallback, callback, denyCallback, maxDepth, maxNodes) {
      this.recurseCallback = recurseCallback;
      this.acceptCallback  = acceptCallback;
      this.callback        = callback;
      this.denyCallback    = typeof denyCallback === 'function' ? denyCallback : false;
      this.level           = 0;
      this.numNodes        = 0;
      this._break          = false;
      this.maxDepth        = maxDepth;
      this.maxNodes        = maxNodes;
    }

    _traverse (node, context) {
      let nodes;

      if (this._break) {
        return;
      }

      if (this.maxNodes > 0 && this.numNodes >= this.maxNodes) {
        return;
      }

      if (instanceTypeUtil.isNode(node)) {
        if (this.acceptCallback(node)) {
          this.callback(node, context);
          this.numNodes++;
        } else if (this.denyCallback) {
          this.denyCallback(node, context);
        }

        if (this.recurseCallback(node)) {
          this.level++;
          if (!this.maxDepth || this.level <= this.maxDepth) {
            nodes = node.getNodes();

            while (nodes.hasNext()) {
              this._traverse(nodes.nextNode(), context);
            }
          }
          this.level--;
        }
      }
    }

    /**
     * Main traversal function. Traverses node structures either through JCR structure
     * or through the Rest API.
     *
     * @param   {Node} node The start node to traverse recursively on.
     * @returns {Void}
     */
    traverse (node, context) {
      this.numNodes = 0;
      this._break = false;

      this._traverse(node, context);
    }

    /**
     * Indicates that the traversal should break and halt further traversing and execution.
     *
     * @returns {Void}
     */
    break () {
      this._break = true;
    }
  }

  return Traversal;
}));
