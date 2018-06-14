Traversal Builder
=================

```js

var traversalBuilder = require('./traversal-builder');

traversalBuilder
	.setCallback(function (node) {
		out.println(node.toString());
	});

var traversal = traversalBuilder.build();

traversal.traverse(startNode);

```