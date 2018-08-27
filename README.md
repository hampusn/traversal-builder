Traversal Builder
=================

Builder for creating a traversal which can traverse node trees in SiteVision.

## Methods

Return | Method | Description
------ | ------ | -----------
`TraversalBuilder` | `setRecurseTypes (Array types)` | Set which primary node types to recurse/traverse on. See [NodeTypeUtil][docs-node-type-util] for examples.
`TraversalBuilder` | `setAcceptTypes (Array types)` | Set which primary node types to execute callback on. See [NodeTypeUtil][docs-node-type-util] for examples.
`TraversalBuilder` | `setCallback (Function callback)` | Set the callback which will be executed on all traversed nodes matching the accept types.
`TraversalBuilder` | `setDenyCallback (Function denyCallback)` | Set the callback which will be executed on all traversed nodes matching the accept types.
`TraversalBuilder` | `setMaxDepth (int maxDepth)` | Set the max depth to traverse. This is the max amount of times `Node.getNodes()` will be called recursivly.
`TraversalBuilder` | `setMaxNodes (int maxNodes)` | Set the max number of nodes to execute the callback on.
`TraversalBuilder` | `setUseRestApi (boolean useRestApi)` | Set whether to use the REST API or through the regular JCR structure.
`Traversal` | `build ()` | Build a traversal object.

## Traversal
`Traversal` is the object which is built by the `TraversalBuilder`.

### Methods
The built `Traversal` instance has the following methods.

Return | Method | Description
------ | ------ | -----------
`Void` | `traverse (Node node, Object context)` | Main traversal function. Traverses node structures either through JCR structure or through the Rest API.

## Example

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

[docs-node-type-util]: https://developer.sitevision.se/webdav/files/apidocs/senselogic/sitevision/api/node/NodeTypeUtil.html