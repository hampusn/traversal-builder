Traversal Builder
=================

Builder for creating a traversal which can traverse node trees in SiteVision.

## Methods

Return | Method | Description
------ | ------ | -----------
`TraversalBuilder` | `setRecurseTypes (Array types)` | Set which primary node types to recurse/traverse on. See [NodeTypeUtil][docs-node-type-util] for examples.
`TraversalBuilder` | `setAcceptTypes (Array types)` | Set which primary node types to execute callback on. See [NodeTypeUtil][docs-node-type-util] for examples.
`TraversalBuilder` | `setRecurseCallback (Function callback)` | Set the callback which will be used to determine if the current node should be traversed or not. This callback will be used instead of the default check of node types.
`TraversalBuilder` | `setAcceptCallback (Function callback)` | Set the callback which will be used to determine if a node is accepted for executing the main callback. This callback will be used instead of the default check of node types.
`TraversalBuilder` | `setCallback (Function callback)` | Set the callback which will be executed on all traversed nodes matching the accept types.
`TraversalBuilder` | `setDenyCallback (Function denyCallback)` | Set the callback which will be executed on all traversed nodes matching the accept types.
`TraversalBuilder` | `setMaxDepth (int maxDepth)` | Set the max depth to traverse. This is the max amount of times `Node.getNodes()` will be called recursivly.
`TraversalBuilder` | `setMaxNodes (int maxNodes)` | Set the max number of nodes to execute the callback on.
`Traversal` | `build ()` | Build a traversal object.

## Traversal
`Traversal` is the object which is built by the `TraversalBuilder`.

### Methods
The built `Traversal` instance has the following methods.

Return | Method | Description
------ | ------ | -----------
`Void` | `traverse (Node node, Object context)` | Main traversal function. Traverses node structures either through JCR structure or through the Rest API.
`Void` | `break ()` | Indicates that the traversal should break and halt further traversing and execution. The break will happen at the beginning of the next iteration. So the current iteration (callback on node) will still finish.

## Example

Simple example

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

Chunk the iteration by setting and checking a metadata

```js
var nodeTypeUtil = require('NodeTypeUtil');
var propertyUtil = require('PropertyUtil');
var metadataUtil = require('MetadataUtil');
var metadataName = 'has-been-processed';

traversalBuilder
  .setAcceptCallback(function (node) {
    var isAcceptedType   = nodeTypeUtil.isTypeOf(node, [nodeTypeUtil.ARTICLE_TYPE, nodeTypeUtil.PAGE_TYPE]);
    var hasBeenProcessed = propertyUtil.getString(node, metadataName, '').equals('Yes');

    return isAcceptedType && hasBeenProcessed == false;
  })
  .setCallback(function (node) {
    out.println(node.toString());

    metadataUtil.setMetadataPropertyValue(node, metadataName, 'Yes');
  })
  .setMaxNodes(50);

var traversal = traversalBuilder.build();

if (scriptVariables.startNode) {
  traversal.traverse(startNode);
}
```


[docs-node-type-util]: https://developer.sitevision.se/webdav/files/apidocs/senselogic/sitevision/api/node/NodeTypeUtil.html