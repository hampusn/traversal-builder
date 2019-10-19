/* globals require, module */
let __traversalBuilder = null; // Fix for modules not being singletons in SiteVision.
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

  const Builder = require('./builder');

  if (!__traversalBuilder) {
    __traversalBuilder = new Builder();
  }

  return __traversalBuilder;
}));