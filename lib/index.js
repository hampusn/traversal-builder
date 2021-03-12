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
    root.traversalBuilder = factory(require);
  }
}(typeof self !== 'undefined' ? self : this, function (require) {

  const TraversalBuilder = require('./TraversalBuilder');
  const Traversal = require('./Traversal');

  return {
    TraversalBuilder,
    Traversal
  };
}));