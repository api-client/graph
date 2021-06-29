/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
const DEFAULT_EDGE_NAME = "\x00";
const GRAPH_NODE = "\x00";
const EDGE_KEY_DELIM = "\x01";

/** @typedef {import('./types').GraphInit} GraphInit */
/** @typedef {import('./types').NodeIdentifier} NodeIdentifier */
/** @typedef {import('./types').NodeChildren} NodeChildren */
/** @typedef {import('./types').NodeParents} NodeParents */
/** @typedef {import('./types').CountedEdges} CountedEdges */
/** @typedef {import('./types').CountedEdge} CountedEdge */
/** @typedef {import('./types').Edge} Edge */

export const isDirectedValue = Symbol('isDirectedValue');
export const isMultigraph = Symbol('isMultigraph');
export const isCompound = Symbol('isCompound');
export const graphLabelValue = Symbol('graphLabelValue');
export const nodesValue = Symbol('nodesValue');
export const parentValue = Symbol('parentValue');
export const childrenValue = Symbol('parentValue');
export const inValue = Symbol('inValue');
export const outValue = Symbol('outValue');
export const predecessorsValue = Symbol('predecessorsValue');
export const successorsValue = Symbol('successorsValue');
export const edgeObjectsValue = Symbol('edgeObjectsValue');
export const edgeLabelsValue = Symbol('edgeLabelsValue');
export const nodeCountValue = Symbol('nodeCountValue');
export const edgeCountValue = Symbol('edgeCountValue');
export const removeFromParentsChildList = Symbol('removeFromParentsChildList');
export const defaultEdgeLabelFn = Symbol('defaultEdgeLabelFn');
export const defaultNodeLabelFn = Symbol('defaultNodeLabelFn');

/**
 * @param {CountedEdge} map 
 * @param {NodeIdentifier} k 
 */
function incrementOrInitEntry(map, k) {
  if (map[k]) {
    map[k]++;
  } else {
    map[k] = 1;
  }
}

/**
 * @param {CountedEdge} map 
 * @param {NodeIdentifier} k 
 */
function decrementOrRemoveEntry(map, k) {
  map[k] -= 1;
  if (!map[k]) { 
    delete map[k]; 
  }
}

/**
 * @param {boolean} isDirected 
 * @param {NodeIdentifier} v_
 * @param {NodeIdentifier} w_ Required when the `v` is not an Edge. When the `v` is Edge then this is the same as `value`.
 * @param {string|number=} name
 * @returns {string}
 */
function edgeArgsToId(isDirected, v_, w_, name) {
  let v = String(v_);
  let w = String(w_);
  if (!isDirected && v > w) {
    const tmp = v;
    v = w;
    w = tmp;
  }
  return v + EDGE_KEY_DELIM + w + EDGE_KEY_DELIM + (name || DEFAULT_EDGE_NAME);
}

/**
 * @param {boolean} isDirected 
 * @param {NodeIdentifier} v_
 * @param {NodeIdentifier} w_ Required when the `v` is not an Edge. When the `v` is Edge then this is the same as `value`.
 * @param {string|number=} name
 * @returns {Edge}
 */
function edgeArgsToObj(isDirected, v_, w_, name) {
  let v = String(v_);
  let w = String(w_);
  if (!isDirected && v > w) {
    const tmp = v;
    v = w;
    w = tmp;
  }
  const edgeObj =  { v, w };
  if (name) {
    edgeObj.name = name;
  }
  return edgeObj;
}

/**
 * @param {boolean} isDirected 
 * @param {Edge} edgeObj 
 * @returns {string}
 */
function edgeObjToId(isDirected, edgeObj) {
  return edgeArgsToId(isDirected, edgeObj.v, edgeObj.w, edgeObj.name);
}

/**
 * @param {object} obj 
 * @returns {boolean} True if the object is not set or has no properties.
 */
function isEmptyObject(obj) {
  if (!obj) {
    return true;
  }
  return Object.keys(obj).length === 0;
}

// Implementation notes:
//
//  * Node id query functions should return string ids for the nodes
//  * Edge id query functions should return an "edgeObj", edge object, that is
//    composed of enough information to uniquely identify an edge: {v, w, name}.
//  * Internally we use an "edgeId", a stringified form of the edgeObj, to
//    reference edges. This is because we need a performant way to look these
//    edges up and, object properties, which have string keys, are the closest
//    we're going to get to a performant hash table in JavaScript.

/**
 * The graph library.
 * 
 * The `N` interface represents a node dictionary and the `E` interface represents an edge dictionary.
 */
export class Graph {
  /**
   * @param {GraphInit=} opts Graph init options
   */
  constructor(opts={}) {
    /** @type {boolean} */ 
    this[isDirectedValue] = typeof opts.directed === 'boolean' ? opts.directed : true;
    /** @type {boolean} */ 
    this[isMultigraph] = typeof opts.multigraph === 'boolean' ? opts.multigraph : false;
    /** @type {boolean} */ 
    this[isCompound] = typeof opts.compound === 'boolean' ? opts.compound : false;

    /**
     * Label for the graph itself
     * @type {any}
     */
    this[graphLabelValue] = undefined;

    /**
     * v -> label
     * @type {Record<NodeIdentifier, any>}
     */
    this[nodesValue] = {};

    if (this[isCompound]) {
      // v -> parent

      /** @type {NodeParents} */ 
      this[parentValue] = {};

      // v -> children
      /** @type {NodeChildren} */ 
      this[childrenValue] = {};
      this[childrenValue][GRAPH_NODE] = {};
    }

    /**
     * v -> edgeObj
     * @type {Record<NodeIdentifier, Record<NodeIdentifier, Edge>>}
     */
    this[inValue] = {};

    /**
     * u -> v -> Number
     * @type {CountedEdges}
     */
    this[predecessorsValue] = {};
    /**
     * v -> edgeObj
     * @type {Record<NodeIdentifier, Record<NodeIdentifier, Edge>>}
     */
    this[outValue] = {};

    /**
     * u -> w -> Number
     * @type {CountedEdges}
     */
    this[successorsValue] = {};

    /**
     * e -> edgeObj
     * @type {Record<NodeIdentifier, Edge>}
     */
    this[edgeObjectsValue] = {};

    /**
     * e -> label
     * @type {Record<NodeIdentifier, any>}
     */
    this[edgeLabelsValue] = {};

    /* Number of nodes in the graph. Should only be changed by the implementation. */
    this[nodeCountValue] = 0;

    /* Number of edges in the graph. Should only be changed by the implementation. */
    this[edgeCountValue] = 0;
  }

  /* === Graph functions ========= */

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
   * @returns {boolean} `true` if the graph is directed.
   */
  isDirected() {
    return this[isDirectedValue];
  }

  /**
   * @returns {boolean} `true` if the graph is a [multigraph](https://github.com/dagrejs/graphlib/wiki/API-Reference#multigraphs).
   */
  isMultigraph() {
    return this[isMultigraph];
  }

  /**
   * @returns {boolean} `true` if the graph is [compound](https://github.com/dagrejs/graphlib/wiki/API-Reference#compound-graphs).
   */
  isCompound() {
    return this[isCompound];
  }

  /**
   * Sets the label for the graph to `label`.
   * @param {any} label 
   * @returns {Graph}
   */
  setGraph(label) {
    this[graphLabelValue] = label;
    return this;
  };

  /**
   * @returns {any|undefined} The currently assigned label for the graph. If no label has been assigned, returns undefined
   */
  graph() {
    return this[graphLabelValue];
  }

  /**
   * Defaults to be set when creating a new node
   * @param {NodeIdentifier=} node 
   * @returns {any}
   */
  // eslint-disable-next-line no-unused-vars
  [defaultNodeLabelFn](node) {
    return undefined;
  }

  /**
   * Defaults to be set when creating a new edge
   * @param {NodeIdentifier} v 
   * @param {NodeIdentifier} w 
   * @param {string|number=} name 
   * @returns {any}
   */
  // eslint-disable-next-line no-unused-vars
  [defaultEdgeLabelFn](v, w, name) {
    return undefined
  }

  /* === Node functions ========== */

  /**
   * Sets a new default value that is assigned to nodes that are created without a label. 
   * If the value is not a function it is assigned as the label directly. 
   * If the value is a function, it is called with the id of the node being created.
   * 
   * @param {string|((node?: NodeIdentifier) => any)} newDefault 
   * @returns {Graph}
   */
  setDefaultNodeLabel(newDefault) {
    if (typeof newDefault === 'function') {
      this[defaultNodeLabelFn] = newDefault;
    } else {
      this[defaultNodeLabelFn] = () => newDefault;
    }
    return this;
  }

  /**
   * @returns {number} the number of nodes in the graph.
   */
  nodeCount() {
    return this[nodeCountValue];
  }

  /**
   * @returns {NodeIdentifier[]} the ids of the nodes in the graph. Use node(v) to get the label for each node. Takes O(|V|) time.
   */
  nodes() {
    return Object.keys(this[nodesValue]);
  }

  /**
   * @returns {NodeIdentifier[]} those nodes in the graph that have no in-edges. Takes O(|V|) time.
   */
  sources() {
    const ids = this.nodes();
    return ids.filter((v) => {
      const cnf = this[inValue][v];
      return isEmptyObject(cnf);
    });
  }

  /**
   * @returns {NodeIdentifier[]} those nodes in the graph that have no out-edges. Takes O(|V|) time.
   */
  sinks() {
    const ids = this.nodes();
    return ids.filter((v) => {
      const cnf = this[outValue][v];
      return isEmptyObject(cnf);
    });
  }

  /**
   * @param {NodeIdentifier[]} vs 
   * @param {any=} value 
   * @returns {Graph}
   */
  setNodes(vs, value) {
    Array.from(vs).forEach((current) => {
      if (typeof value === 'undefined') {
        this.setNode(current);
      } else {
        this.setNode(current, value);
      }
    });
    return this;
  }

  /**
   * Creates or updates the value for the node v in the graph. 
   * If `label` is supplied it is set as the value for the node. 
   * If `label` is not supplied and the node was created by this call then the default node label 
   * is assigned. 
   * 
   * @param {NodeIdentifier} v The node to set
   * @param {any=} label 
   * @returns {Graph} the graph, allowing this to be chained with other functions. Takes O(1) time.
   */
  setNode(v, label) {
    const hasNode = Object.prototype.hasOwnProperty.call(this[nodesValue], v);
    if (hasNode) {
      if (label) {
        this[nodesValue][v] = label;
      }
      return this;
    }
    this[nodesValue][v] = label || this[defaultNodeLabelFn](v);
    if (this[isCompound]) {
      this[parentValue][v] = GRAPH_NODE;
      this[childrenValue][v] = {};
      this[childrenValue][GRAPH_NODE][v] = true;
    }
    this[inValue][v] = {};
    this[predecessorsValue][v] = {};
    this[outValue][v] = {};
    this[successorsValue][v] = {};
    ++this[nodeCountValue];
    return this;
  }

  /**
   * @param {NodeIdentifier} v 
   * @returns {any|undefined} the label assigned to the node or undefined when not found. Takes O(1) time.
   */
  node(v) {
    return this[nodesValue][v];
  }

  /**
   * @param {NodeIdentifier} v 
   * @returns {boolean} `true` when the graph has a node. Takes O(1) time.
   */
  hasNode(v) {
    return Object.prototype.hasOwnProperty.call(this[nodesValue], v);
  }

  /**
   * Removes the node with the id v in the graph or does nothing if the node is not in the graph. 
   * If the node was removed this function also removes any incident edges.
   * @param {NodeIdentifier} v 
   * @returns {Graph} the graph, allowing this to be chained with other functions. Takes O(|E|) time.
   */
  removeNode(v) {
    if (!this.hasNode(v)) {
      return this;
    }
    /**
     * @param {NodeIdentifier} e 
     */
    const removeEdge = (e) => { 
      this.removeEdge(this[edgeObjectsValue][e]); 
    };

    delete this[nodesValue][v];
    if (this[isCompound]) {
      this[removeFromParentsChildList](v);
      delete this[parentValue][v];
      const children = this.children(v);
      if (children) {
        children.forEach(child => this.setParent(child));
      }
      delete this[childrenValue][v];
    }
    const ins = this[inValue][v];
    if (ins) {
      const keys = Object.keys(ins);
      keys.forEach(key => removeEdge(key));
      delete this[inValue][v];
    }
    delete this[predecessorsValue][v];
    const outs = this[outValue][v];
    if (outs) {
      const keys = Object.keys(outs);
      keys.forEach(key => removeEdge(key));
      delete this[outValue][v];
    }
    delete this[successorsValue][v];
    this[nodeCountValue] -= 1;
    return this;
  }

  /**
   * Sets the parent for `v` to `parent` if it is defined or removes the parent for `v` if `parent` is undefined. 
   * Throws an error if the graph is not compound.
   * @param {NodeIdentifier} v The node on which to set/remove parent
   * @param {NodeIdentifier=} parent The parent to set. Removes the parent when not set.
   * @returns {Graph} the graph, allowing this to be chained with other functions. Takes O(1) time.
   */
  setParent(v, parent) {
    if (!this[isCompound]) {
      throw new Error("Cannot set parent in a non-compound graph");
    }

    let localParent;

    if (!parent) {
      localParent = GRAPH_NODE;
    } else {
      // Coerce parent to string
      localParent = /** @type NodeIdentifier */ (String(parent));
      for (let ancestor = localParent; ancestor; ancestor = this.parent(ancestor)) {
        if (ancestor === v) {
          throw new Error(`Setting ${localParent} as parent of ${v} would create a cycle`);
        }
      }
      this.setNode(localParent);
    }

    this.setNode(v);
    this[removeFromParentsChildList](v);
    this[parentValue][v] = localParent;
    this[childrenValue][localParent][v] = true;
    return this;
  }

  /**
   * @param {NodeIdentifier} v 
   */
  [removeFromParentsChildList](v) {
    delete this[childrenValue][this[parentValue][v]][v];
  }

  /**
   * @param {NodeIdentifier} v 
   * @returns {NodeIdentifier|undefined} the node that is a parent of node `v` or undefined if node `v` does not have a parent or is not a member of the graph. 
   * Always returns `undefined` for graphs that are not compound. Takes O(1) time.
   */
  parent(v) {
    if (this[isCompound]) {
      const parent = this[parentValue][v];
      if (parent !== GRAPH_NODE) {
        return parent;
      }
    }
    return undefined;
  }

  /**
   * @param {NodeIdentifier=} v 
   * @returns {NodeIdentifier[]|undefined} all nodes that are children of node v or undefined if node v is not in the graph. Always returns [] for graphs that are not compound. Takes O(|V|) time.
   */
  children(v=GRAPH_NODE) {
    if (this[isCompound]) {
      const children = this[childrenValue][v];
      if (children) {
        return Object.keys(children);
      }
    } else if (v === GRAPH_NODE) {
      return this.nodes();
    } else if (this.hasNode(v)) {
      return [];
    }
    return undefined;
  }

  /**
   * @param {NodeIdentifier} v 
   * @returns {NodeIdentifier[]|undefined} all nodes that are predecessors of the specified node or `undefined` if node `v` is not in the graph. 
   * Behavior is `undefined` for undirected graphs - use `neighbors()` instead. Takes O(|V|) time.
   */
  predecessors(v) {
    const predecessorsV = this[predecessorsValue][v];
    if (predecessorsV) {
      return Object.keys(predecessorsV);
    }
    return undefined;
  }

  /**
   * @param {NodeIdentifier} v 
   * @returns {NodeIdentifier[]|undefined} all nodes that are successors of the specified node or `undefined` if node `v` is not in the graph. 
   * Behavior is `undefined` for undirected graphs - use `neighbors()` instead. Takes O(|V|) time.
   */
  successors(v) {
    const successorsV = this[successorsValue][v];
    if (successorsV) {
      return Object.keys(successorsV);
    }
    return undefined;
  }

  /**
   * @param {NodeIdentifier} v 
   * @returns {NodeIdentifier[]} all nodes that are predecessors or successors of the specified node or `undefined` if node v is not in the graph. 
   * Takes O(|V|) time.
   */
  neighbors(v) {
    const predecessors = this.predecessors(v);
    if (!predecessors) {
      return undefined
    }
    const successors = this.successors(v) || [];
    const result = predecessors.concat(successors).filter((item, i, ar) => ar.indexOf(item) === i); 
    // if (!result.length) {
    //   return undefined;
    // }
    return result;
  }

  /**
   * @param {NodeIdentifier} v 
   * @returns {boolean}
   */
  isLeaf(v) {
    /** @type NodeIdentifier[] */ 
    let neighbors;
    if (this.isDirected()) {
      neighbors = this.successors(v);
    } else {
      neighbors = this.neighbors(v);
    }
    return !neighbors || neighbors.length === 0;
  }

  /**
   * @param {(id: NodeIdentifier) => boolean} filter The filter function.
   * @returns {Graph}
   */
  filterNodes(filter) {
    const copy = new Graph({
      directed: this[isDirectedValue],
      multigraph: this[isMultigraph],
      compound: this[isCompound]
    });
    copy.setGraph(this.graph());

    Object.keys(this[nodesValue]).forEach((key) => {
      if (filter(key)) {
        copy.setNode(key, this[nodesValue][key]);
      }
    });
    Object.keys(this[edgeObjectsValue]).forEach((key) => {
      const edge = this[edgeObjectsValue][key];
      if (copy.hasNode(edge.v) && copy.hasNode(edge.w)) {
        copy.setEdge(edge, this.edge(edge));
      }
    });
    const parents = {};
    /**
     * @param {NodeIdentifier} v 
     * @returns {NodeIdentifier|undefined}
     */
    const findParent = (v) => {
      const parent = this.parent(v);
      if (parent === undefined || copy.hasNode(parent)) {
        parents[v] = parent;
        return parent;
      } 
      if (parent in parents) {
        return parents[parent];
      }
      return findParent(parent);
    }

    if (this[isCompound]) {
      copy.nodes().forEach((key) => {
        copy.setParent(key, findParent(key));
      });
    }
    return copy;
  };

  /* === Edge functions ========== */

  /**
   * Sets a new default value that is assigned to edges that are created without a label. 
   * If the value is not a function it is assigned as the label directly. 
   * If the value is a function, it is called with the parameters (v, w, name).
   * 
   * @param {string|((v:NodeIdentifier, w:NodeIdentifier, name?: string|number) => any)} newDefault 
   * @returns {Graph}
   */
  setDefaultEdgeLabel(newDefault) {
    if (typeof newDefault === 'function') {
      this[defaultEdgeLabelFn] = newDefault;
    } else {
      this[defaultEdgeLabelFn] = () => newDefault;
    }
    return this;
  }

  /**
   * @returns {number} the number of edges in the graph.
   */
  edgeCount() {
    return this[edgeCountValue];
  }

  /**
   * @returns {Edge[]} the edge object for each edge in the graph. Use edge(edgeObj) to get the label for each edge. Takes O(|E|) time.
   */
  edges() {
    return Object.values(this[edgeObjectsValue]);
  }

  /**
   * @param {NodeIdentifier[]} vs 
   * @param {string=} value 
   * @returns {Graph}
   */
  setPath(vs, value) {
    if (!Array.isArray(vs)) {
      return this;
    }
    // Note, there's a difference here between setting an `undefined` value and not setting it at all.
    const hasValue = arguments.length > 1;
    vs.reduce((previousValue, currentValue) => {
      if (hasValue) {
        this.setEdge(previousValue, currentValue, value);
      } else {
        this.setEdge(previousValue, currentValue);
      }
      return currentValue;
    });
    return this;
  }

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
   * @param {NodeIdentifier|Edge} v
   * @param {NodeIdentifier|any=} w Required when the `v` is not an Edge. When the `v` is Edge then this is the same as `value`.
   * @param {any=} value
   * @param {string|number=} name
   * @returns {Graph} Returns the graph, allowing this to be chained with other functions. 
   */
  setEdge(v, w, value, name) {
    let valueSpecified = false;

    /** @type NodeIdentifier */
    let vArg;
    /** @type NodeIdentifier */
    let wArg;
    /** @type number|string */
    let valueArg;
    /** @type string|number */
    let nameArg;
    if (typeof v === 'object' && v !== null && "v" in v) {
      const typed = /** @type Edge */ (v);
      vArg = typed.v;
      wArg = typed.w;
      nameArg = typed.name;
      if (w) {
        valueArg = /** @type number */ (w);
        valueSpecified = true;
      }
    } else {
      vArg = /** @type NodeIdentifier */ (v);
      wArg = /** @type NodeIdentifier */ (w);
      nameArg = name;
      // there's a difference between passing `undefined` and not passing anything.
      if (arguments.length > 2) {
        valueArg = value;
        valueSpecified = true;
      }
    }

    vArg = String(vArg);
    wArg = String(wArg);
    if (nameArg) {
      nameArg = String(nameArg);
    }
    const e = edgeArgsToId(this[isDirectedValue], vArg, wArg, nameArg);
    const hasEdge = Object.prototype.hasOwnProperty.call(this[edgeLabelsValue], e);
    if (hasEdge) {
      if (valueSpecified) {
        this[edgeLabelsValue][e] = valueArg;
      }
      return this;
    }
    
    if (name && !this[isMultigraph]) {
      throw new Error("Cannot set a named edge when isMultigraph = false");
    }
    
    // It didn't exist, so we need to create it.
    // First ensure the nodes exist.
    this.setNode(vArg);
    this.setNode(wArg);
    
    this[edgeLabelsValue][e] = valueSpecified ? valueArg : this[defaultEdgeLabelFn](vArg, wArg, nameArg);
    
    const edgeObj = edgeArgsToObj(this[isDirectedValue], vArg, wArg, nameArg);
    // Ensure we add undirected edges in a consistent way.
    vArg = edgeObj.v;
    wArg = edgeObj.w;

    Object.freeze(edgeObj);
    this[edgeObjectsValue][e] = edgeObj;
    incrementOrInitEntry(this[predecessorsValue][wArg], vArg);
    incrementOrInitEntry(this[successorsValue][vArg], wArg);
    this[inValue][wArg][e] = edgeObj;
    this[outValue][vArg][e] = edgeObj;
    this[edgeCountValue]++;
    return this;
  }

  /**
   * The name parameter is only useful with multi graphs. `v` and `w` can be interchanged for undirected graphs. 
   * 
   * Takes O(1) time.
   * 
   * @param {Edge|NodeIdentifier} v 
   * @param {NodeIdentifier|string=} w Required when `v` is not an edge. When the `v` is an object then this is `name` param.
   * @param {string|string=} name 
   * @returns {any|undefined} the label for the edge (v, w) if the graph has an edge between `v` and `w` with the optional name.
   * Returns `undefined` if there is no such edge in the graph. 
   */
  edge(v, w, name) {
    /** @type NodeIdentifier */
    let edge;
    if (typeof v === 'object') {
      edge = edgeObjToId(this[isDirectedValue], v);
    } else {
      edge = edgeArgsToId(this[isDirectedValue], v, w, name);
    }
    return this[edgeLabelsValue][edge];
  }

  /**
   * The name parameter is only useful with [multi graphs](https://github.com/dagrejs/graphlib/wiki/API-Reference#multigraphs). 
   * `v` and `w` can be interchanged for undirected graphs. 
   * 
   * Takes O(1) time.
   * 
   * @param {Edge|NodeIdentifier} v 
   * @param {NodeIdentifier|string=} w Required when `v` is not an edge. When the `v` is an object then this is `name` param.
   * @param {string=} name 
   * @returns {boolean} `true` if the graph has an edge between `v` and `w` with the optional name. 
   */
  hasEdge(v, w, name) {
    /** @type NodeIdentifier */
    let edge;
    if (typeof v === 'object') {
      edge = edgeObjToId(this[isDirectedValue], v);
    } else {
      edge = edgeArgsToId(this[isDirectedValue], v, w, name);
    }
    const hasEdge = Object.prototype.hasOwnProperty.call(this[edgeLabelsValue], edge);
    return hasEdge;
  }

  /**
   * Removes the edge (v, w) if the graph has an edge between `v` and `w` with the optional name. 
   * If not this function does nothing. The `name` parameter is only useful with multi graphs. 
   * `v` and `w` can be interchanged for undirected graphs. 
   * 
   * Takes O(1) time.
   * 
   * @param {Edge|NodeIdentifier} v 
   * @param {NodeIdentifier|string=} w Required when `v` is not an edge. When the `v` is an object then this is `name` param.
   * @param {string=} name 
   * @returns {Graph}
   */
  removeEdge(v, w, name) {
    /** @type NodeIdentifier */
    let id;
    if (typeof v === 'object') {
      id = edgeObjToId(this[isDirectedValue], v);
    } else {
      id = edgeArgsToId(this[isDirectedValue], v, w, name);
    }

    const edge = this[edgeObjectsValue][id];
    if (edge) {
      delete this[edgeLabelsValue][id];
      delete this[edgeObjectsValue][id];
      decrementOrRemoveEntry(this[predecessorsValue][edge.w], edge.v);
      decrementOrRemoveEntry(this[successorsValue][edge.v], edge.w);
      delete this[inValue][edge.w][id];
      delete this[outValue][edge.v][id];
      this[edgeCountValue]--;
    }
    return this;
  }

  /**
   * Returns all edges that point to the node `v`. 
   * Optionally filters those edges down to just those coming from node `u`. 
   * Behavior is undefined for undirected graphs - use `nodeEdges()` instead.
   * 
   * Takes O(|E|) time.
   * 
   * @param {NodeIdentifier} v 
   * @param {NodeIdentifier=} u 
   * @returns {Edge[]|undefined} all edges that point to the node `v`. Returns undefined if node v is not in the graph.
   */
  inEdges(v, u) {
    const inV = this[inValue][v];
    if (inV) {
      const edges = Object.values(inV);
      if (!u) {
        return edges;
      }
      return edges.filter(edge => edge.v === u);
    }
    return undefined;
  }

  /**
   * Return all edges that are pointed at by node `v`.
   * Optionally filters those edges down to just those point to `w`.
   * Behavior is undefined for undirected graphs - use `nodeEdges()` instead.
   * 
   * Takes O(|E|) time.
   * 
   * @param {NodeIdentifier} v 
   * @param {NodeIdentifier=} w
   * @returns {Edge[]|undefined} all edges that are pointed at by node `v`. Returns undefined if node v is not in the graph.
   */
  outEdges(v, w) {
    const outV = this[outValue][v];
    if (outV) {
      const edges = Object.values(outV);
      if (!w) {
        return edges;
      }
      return edges.filter(edge => edge.w === w);
    }
    return undefined;
  }

  /**
   * Returns all edges to or from node `v` regardless of direction. 
   * Optionally filters those edges down to just those between nodes `v` and `w` regardless of direction. 
   * 
   * Takes O(|E|) time.
   * 
   * @param {NodeIdentifier} v 
   * @param {NodeIdentifier=} w
   * @returns {Edge[]|undefined} Returns undefined if node v is not in the graph.
   */
  nodeEdges(v, w) {
    const inEdges = this.inEdges(v, w) || [];
    const out = this.outEdges(v, w) || [];
    const result = inEdges.concat(out);
    if (result.length) {
      return result;
    }
    return undefined;
  }
}
