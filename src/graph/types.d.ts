export declare interface GraphInit {
  /**
   * Set to `true` to get a directed graph and `false` to get an undirected graph. 
   * An undirected graph does not treat the order of nodes in an edge as significant. 
   * In other words, `g.edge("a", "b") === g.edge("b", "a")` for an undirected graph. 
   * 
   * @default true
   */
  directed?: boolean;
  /**
   * Set to true to allow a graph to have multiple edges between the same pair of nodes. 
   * 
   * @default false
   */
  multigraph?: boolean;
  /**
   * Set to true to allow a graph to have compound nodes - nodes which can be the parent of other nodes. 
   * 
   * @default false
   */
  compound?: boolean;
}

export declare interface Node<T> {
  /**
   * Node identifier
   */
  v: NodeIdentifier;
  value?: T;
  parent?: NodeIdentifier;
}

export declare interface EdgeBase {
  /**
   * The edges start node
   */
  v: NodeIdentifier;
  /**
   * The edges end node
   */
  w: NodeIdentifier;
  /**
   * The name of the edge.
   */
  name?: string;
}

export declare interface Edge<T> extends EdgeBase {
  /**
   * The label of the edge.
   */
  label?: T;
}

export declare interface JsonEdge<T> extends EdgeBase {
  /**
   * The label of the edge.
   */
  value?: T;
}

export type NodeIdentifier = string | number;
export type NodeChildren = Record<NodeIdentifier, Record<NodeIdentifier, boolean>>;
export type NodeParents = Record<NodeIdentifier, NodeIdentifier>;
export type CountedEdge = Record<NodeIdentifier, number>;
export type CountedEdges = Record<NodeIdentifier, CountedEdge>;

/**
 * G - Graph value
 * N - Node value
 * E - Edge value
 */
export declare interface GraphJson<G, N, E> {
  options: GraphInit;
  nodes: Node<N>[];
  edges: JsonEdge<E>[];
  value?: G;
}

export declare interface PriorityQueueItem {
  key: string;
  priority: number;
}

export declare interface NodePath {
  distance: number;
  predecessor?: NodeIdentifier;
}

export type FloydWarshallResult = Record<NodeIdentifier, Record<NodeIdentifier, NodePath>>;
