import { Graph } from './Graph.js';

/** @typedef {import('./types').Node} Node */
/** @typedef {import('./types').JsonEdge} JsonEdge */
/** @typedef {import('./types').GraphJson} GraphJson */

/**
 * @param {Graph} g 
 * @returns {Node[]}
 */
function writeNodes(g) {
  return g.nodes().map((v) => {
    const nodeValue = g.node(v);
    const parent = g.parent(v);
    const node = /** @type Node */ { v };
    if (nodeValue) {
      node.value = nodeValue;
    }
    if (parent) {
      node.parent = parent;
    }
    return node;
  });
}

/**
 * @param {Graph} g 
 * @returns {JsonEdge[]}
 */
function writeEdges(g) {
  return g.edges().map((e) => {
    const edgeValue = g.edge(e);
    const edge = /** @type JsonEdge */ ({ v: e.v, w: e.w });
    if (e.name) {
      edge.name = e.name;
    }
    if (edgeValue) {
      edge.value = edgeValue;
    }
    return edge;
  });
}

/**
 * Serializes a graph into a JavaScript object.
 * It is safe to call `JSON.stringify()` on the result.
 * 
 * @param {Graph} g 
 * @returns {GraphJson}
 */
export function serialize(g) {
  const json = {
    options: {
      directed: g.isDirected(),
      multigraph: g.isMultigraph(),
      compound: g.isCompound()
    },
    nodes: writeNodes(g),
    edges: writeEdges(g),
  };
  const graph = g.graph();
  if (graph) {
    json.value = graph;
  }
  return json;
}

/**
 * Reads the previously serialized graph and restores the graph object.
 * 
 * @param {GraphJson} json 
 * @returns {Graph}
 */
export function deserialize(json) {
  const g = new Graph(json.options).setGraph(json.value);
  if (Array.isArray(json.nodes)) {
    json.nodes.forEach((entry) => {
      g.setNode(entry.v, entry.value);
      if (entry.parent) {
        g.setParent(entry.v, entry.parent);
      }
    });
  }
  if (Array.isArray(json.edges)) {
    json.edges.forEach((entry) => {
      g.setEdge({ v: entry.v, w: entry.w, name: entry.name }, entry.value);
    });
  }
  return g;
}
