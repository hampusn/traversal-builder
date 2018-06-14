Traversal Builder
=================

```js

traversalBuilder
  .setCallback(function (node) {
    out.println(node.toString());
  });

var traversal = traversalBuilder.build();

if (scriptVariables.startNode) {
  traversal.traverse(startNode);
}


```