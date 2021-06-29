import { CountedEdges, Edge, GraphInit, NodeChildren, NodeIdentifier, NodeParents } from "./types";

export const isDirectedValue: unique symbol;
export const isMultigraph: unique symbol;
export const isCompound: unique symbol;
export const graphLabelValue: unique symbol;
export const nodesValue: unique symbol;
export const parentValue: unique symbol;
export const childrenValue: unique symbol;
export const inValue: unique symbol;
export const outValue: unique symbol;
export const predecessorsValue: unique symbol;
export const successorsValue: unique symbol;
export const edgeObjectsValue: unique symbol;
export const edgeLabelsValue: unique symbol;
export const nodeCountValue: unique symbol;
export const edgeCountValue: unique symbol;
export const removeFromParentsChildList: unique symbol;
export const defaultEdgeLabelFn: unique symbol;
export const defaultNodeLabelFn: unique symbol;

/**
 * The graph library.
 * The `N` interface represents a node dictionary and the `E` interface represents an edge dictionary.
 */
export declare class Graph<G, N, E> {
  [isDirectedValue]: boolean;
  [isMultigraph]: boolean;
  [isCompound]: boolean;
  [graphLabelValue]: G;
  /**
   * v -> label
   */
  [nodesValue]: Record<NodeIdentifier, N>;
  [parentValue]: NodeParents;

  /** v -> children */
  [childrenValue]: NodeChildren;
  /**
   * v -> edgeObj
   */
  [inValue]: Record<NodeIdentifier, Record<NodeIdentifier, Edge<E>>>;

  /**
   * u -> v -> Number
   */
  [predecessorsValue]: CountedEdges;
  /**
   * v -> edgeObj
   * @type {}
   */
  [outValue]: Record<NodeIdentifier, Record<NodeIdentifier, Edge<E>>>;

  /**
   * u -> w -> Number
   */
  [successorsValue]: CountedEdges;

  /**
   * e -> edgeObj
   */
  [edgeObjectsValue]: Record<NodeIdentifier, Edge<E>>;

  /**
   * e -> label
   */
  [edgeLabelsValue]: Record<NodeIdentifier, E>;

  /* Number of nodes in the graph. Should only be changed by the implementation. */
  [nodeCountValue]: number;

  /* Number of edges in the graph. Should only be changed by the implementation. */
  [edgeCountValue]: number;

  /**
   * @param opts Graph init options
   */
  constructor(opts?: GraphInit);

  /**
   * A directed graph treats the order of nodes in an edge as significant whereas an undirected graph does not. 
   * 
   * This example demonstrates the difference:
   * 
   * ```javascript
   * var directed = new Graph({ directed: true });
   * directed.setEdge("a", "b", "my-label");
   * directed.edge("a", "b"); // returns "my-label"
   * directed.edge("b", "a"); // returns undefined
   * 
   * var undirected = new Graph({ directed: false });
   * undirected.setEdge("a", "b", "my-label");
   * undirected.edge("a", "b"); // returns "my-label"
   * undirected.edge("b", "a"); // returns "my-label"
   * ```
   * 
   * @returns `true` if the graph is directed.
   */
  isDirected(): boolean;

  /**
   * @returns `true` if the graph is a [multigraph](https://github.com/dagrejs/graphlib/wiki/API-Reference#multigraphs).
   */
  isMultigraph(): boolean;

  /**
   * @returns `true` if the graph is [compound](https://github.com/dagrejs/graphlib/wiki/API-Reference#compound-graphs).
   */
  isCompound(): boolean;

  /**
   * Sets the label for the graph to `label`.
   */
  setGraph(label: G): this;

  /**
   * @returns The currently assigned label for the graph. If no label has been assigned, returns undefined
   */
  graph(): G | undefined;

  /**
   * Defaults to be set when creating a new node
   */
  [defaultNodeLabelFn](node?: NodeIdentifier): N | undefined;

  /**
   * Defaults to be set when creating a new edge
   */
  [defaultEdgeLabelFn](v: NodeIdentifier, w: NodeIdentifier, name?: string): E | undefined;

  /**
   * Sets a new default value that is assigned to nodes that are created without a label. 
   * If the value is not a function it is assigned as the label directly. 
   * If the value is a function, it is called with the id of the node being created.
   */
  setDefaultNodeLabel(newDefault: string | ((node?: NodeIdentifier) => N)): this;

  /**
   * @returns the number of nodes in the graph.
   */
  nodeCount(): number;
  /**
   * @returns the ids of the nodes in the graph. Use node(v) to get the label for each node. Takes O(|V|) time.
   */
  nodes(): NodeIdentifier[];

  /**
   * @returns those nodes in the graph that have no in-edges. Takes O(|V|) time.
   */
  sources(): NodeIdentifier[];

  /**
   * @returns those nodes in the graph that have no out-edges. Takes O(|V|) time.
   */
  sinks(): NodeIdentifier[];

  /**
   * Shortcut to calling `setNode()` on each array element
   */
  setNodes(vs: NodeIdentifier[], value?: N): this;

  /**
   * Creates or updates the value for the node v in the graph. 
   * If `label` is supplied it is set as the value for the node. 
   * If `label` is not supplied and the node was created by this call then the default node label 
   * is assigned. 
   * 
   * @param v The node to set
   * @returns the graph, allowing this to be chained with other functions. Takes O(1) time.
   */
  setNode(v: NodeIdentifier, label?: N): this;

  /**
   * @returns the label assigned to the node or undefined when not found. Takes O(1) time.
   */
  node(v: NodeIdentifier): N | undefined;

  /**
   * @returns `true` when the graph has a node. Takes O(1) time.
   */
  hasNode(v: NodeIdentifier): boolean;

  /**
   * Removes the node with the id v in the graph or does nothing if the node is not in the graph. 
   * If the node was removed this function also removes any incident edges.
   * 
   * @returns the graph, allowing this to be chained with other functions. Takes O(|E|) time.
   */
  removeNode(v: NodeIdentifier): this;

  /**
   * Sets the parent for `v` to `parent` if it is defined or removes the parent for `v` if `parent` is undefined. 
   * Throws an error if the graph is not compound.
   * @param v The node on which to set/remove parent
   * @param parent The parent to set. Removes the parent when not set.
   * @returns the graph, allowing this to be chained with other functions. Takes O(1) time.
   */
  setParent(v: NodeIdentifier, parent?: NodeIdentifier): this;

  [removeFromParentsChildList](v: NodeIdentifier): void;

  /**
   * @returns the node that is a parent of node `v` or undefined if node `v` does not have a parent or is not a member of the graph. 
   * Always returns `undefined` for graphs that are not compound. Takes O(1) time.
   */
  parent(v: NodeIdentifier): NodeIdentifier | undefined;

  /**
   * @returns all nodes that are children of node v or undefined if node v is not in the graph. Always returns [] for graphs that are not compound. Takes O(|V|) time.
   */
  children(v?: NodeIdentifier): NodeIdentifier[] | undefined;

  /**
   * @returns all nodes that are predecessors of the specified node or `undefined` if node `v` is not in the graph. 
   * Behavior is `undefined` for undirected graphs - use `neighbors()` instead. Takes O(|V|) time.
   */
  predecessors(v: NodeIdentifier): NodeIdentifier[] | undefined;

  /**
   * @returns all nodes that are successors of the specified node or `undefined` if node `v` is not in the graph. 
   * Behavior is `undefined` for undirected graphs - use `neighbors()` instead. Takes O(|V|) time.
   */
  successors(v: NodeIdentifier): NodeIdentifier[] | undefined;

  /**
   * @returns all nodes that are predecessors or successors of the specified node or `undefined` if node v is not in the graph. 
   * Takes O(|V|) time.
   */
  neighbors(v: NodeIdentifier): NodeIdentifier[];

  isLeaf(v?: NodeIdentifier): boolean;

  /**
   * @param filter The filter function.
   * @returns A copy of the graph with filtered nodes.
   */
  filterNodes(filter: (id: NodeIdentifier) => boolean): Graph<G, N, E>;

  /**
   * Sets a new default value that is assigned to edges that are created without a label. 
   * If the value is not a function it is assigned as the label directly. 
   * If the value is a function, it is called with the parameters (v, w, name).
   */
  setDefaultEdgeLabel(newDefault: string | ((v: NodeIdentifier, w: NodeIdentifier, name?: string | number) => E)): this;

  /**
   * @returns the number of edges in the graph.
   */
  edgeCount(): number;

  /**
   * @returns the edge object for each edge in the graph. Use edge(edgeObj) to get the label for each edge. Takes O(|E|) time.
   */
  edges(): Edge<E>[];

  setPath(vs: NodeIdentifier[], value?: string): this;

  /**
   * Creates or updates the label for the edge (v, w) with the optionally supplied name. 
   * If `label` is supplied it is set as the value for the edge. If `label` is not supplied and the edge 
   * is created by this call then the default edge label will be assigned. 
   * The name parameter is only useful with multi graphs.
   * setEdge(v, w, [value, [name]])
   * setEdge({ v, w, [name] }, [value])
   * 
   * Takes O(1) time.
   * 
   * @param v
   * @param w Required when the `v` is not an Edge. When the `v` is Edge then this is the same as `value`.
   * @param value
   * @param name
   * @returns Returns the graph, allowing this to be chained with other functions. 
   */
  setEdge(v: NodeIdentifier, w: NodeIdentifier, value?: E, name?: string | number): this;
  /**
   * Creates or updates the label for the edge (v, w) with the optionally supplied name. 
   * If `label` is supplied it is set as the value for the edge. If `label` is not supplied and the edge 
   * is created by this call then the default edge label will be assigned. 
   * The name parameter is only useful with multi graphs.
   * setEdge(v, w, [value, [name]])
   * setEdge({ v, w, [name] }, [value])
   * 
   * Takes O(1) time.
   * 
   * @param edge
   * @param value
   * @returns Returns the graph, allowing this to be chained with other functions. 
   */
  setEdge(edge: Edge<E>, value?: E): this;

  /**
   * The name parameter is only useful with multi graphs. `v` and `w` can be interchanged for undirected graphs. 
   * 
   * Takes O(1) time.
   * 
   * @param v The id of the source node 
   * @param w The id of the target node 
   * @param name 
   * @returns the label for the edge (v, w) if the graph has an edge between `v` and `w` with the optional name.
   * Returns `undefined` if there is no such edge in the graph. 
   */
  edge(v: NodeIdentifier, w: NodeIdentifier, name?: string | number): E | undefined;
  /**
   * The name parameter is only useful with multi graphs. `v` and `w` can be interchanged for undirected graphs. 
   * 
   * Takes O(1) time.
   * 
   * @param edge
   * @param name 
   * @returns the label for the edge (v, w) if the graph has an edge between `v` and `w` with the optional name.
   * Returns `undefined` if there is no such edge in the graph. 
   */
  edge(edge: Edge<E>, name?: string | number): E | undefined;

  /**
   * The name parameter is only useful with [multi graphs](https://github.com/dagrejs/graphlib/wiki/API-Reference#multigraphs). 
   * `v` and `w` can be interchanged for undirected graphs. 
   * 
   * Takes O(1) time.
   * 
   * @param v The id of the source node 
   * @param w The id of the target node 
   * @param name 
   * @returns `true` if the graph has an edge between `v` and `w` with the optional name. 
   */
  hasEdge(v: NodeIdentifier, w: NodeIdentifier, name?: string): boolean;
  /**
   * The name parameter is only useful with [multi graphs](https://github.com/dagrejs/graphlib/wiki/API-Reference#multigraphs). 
   * `v` and `w` can be interchanged for undirected graphs. 
   * 
   * Takes O(1) time.
   * 
   * @param edge The edge to test
   * @param name 
   * @returns `true` if the graph has an edge between `v` and `w` with the optional name. 
   */
  hasEdge(edge: Edge<E>, name?: string): boolean;

  /**
   * Removes the edge (v, w) if the graph has an edge between `v` and `w` with the optional name. 
   * If not this function does nothing. The `name` parameter is only useful with multi graphs. 
   * `v` and `w` can be interchanged for undirected graphs. 
   * 
   * Takes O(1) time.
   * 
   * @param edge The edge to remove.
   * @param name 
   */
  removeEdge(edge: Edge<E>, name?: string): this;
  /**
   * Removes the edge (v, w) if the graph has an edge between `v` and `w` with the optional name. 
   * If not this function does nothing. The `name` parameter is only useful with multi graphs. 
   * `v` and `w` can be interchanged for undirected graphs. 
   * 
   * Takes O(1) time.
   * 
   * @param v The id of the source node 
   * @param w The id of the target node 
   * @param name 
   */
  removeEdge(v: NodeIdentifier, w: NodeIdentifier, name?: string): this;

  /**
   * Returns all edges that point to the node `v`. 
   * Optionally filters those edges down to just those coming from node `u`. 
   * Behavior is undefined for undirected graphs - use `nodeEdges()` instead.
   * 
   * Takes O(|E|) time.
   * 
   * @returns {Edge[]|undefined} all edges that point to the node `v`. Returns undefined if node v is not in the graph.
   */
  inEdges(v: NodeIdentifier, u?: NodeIdentifier): Edge<E>[] | undefined;

  /**
   * Return all edges that are pointed at by node `v`.
   * Optionally filters those edges down to just those point to `w`.
   * Behavior is undefined for undirected graphs - use `nodeEdges()` instead.
   * 
   * Takes O(|E|) time.
   * 
   * @returns all edges that are pointed at by node `v`. Returns undefined if node v is not in the graph.
   */
  outEdges(v: NodeIdentifier, w?: NodeIdentifier): Edge<E>[] | undefined;

  /**
   * Returns all edges to or from node `v` regardless of direction. 
   * Optionally filters those edges down to just those between nodes `v` and `w` regardless of direction. 
   * 
   * Takes O(|E|) time.
   * 
   * @returns {} Returns undefined if node v is not in the graph.
   */
  nodeEdges(v: NodeIdentifier, w?: NodeIdentifier): Edge<E>[] | undefined;
}
