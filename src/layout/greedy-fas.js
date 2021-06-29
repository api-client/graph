/* eslint-disable no-plusplus */
/* eslint-disable no-cond-assign */
import { Graph } from '../graph/Graph.js';
import { List } from "../data/List.js";

/** @typedef {import('../graph/types').Edge} Edge */
/** @typedef {import('../graph/types').NodeIdentifier} NodeIdentifier */
/** @typedef {import('./types').LayoutNode} LayoutNode */
/** @typedef {import('./types').LayoutGraph} LayoutGraph */
/** @typedef {import('./types').LayoutEdge} LayoutEdge */

const DEFAULT_WEIGHT_FN = () => 1;

/**
 * @typedef GreedyFasNode
 * @property {number} in
 * @property {number} out
 * @property {NodeIdentifier} v
 */

/**
 * @typedef GreedyFasState
 * @property {Graph<any, GreedyFasNode, number>} graph
 * @property {List[]} buckets
 * @property {number} zeroIdx
 */

/**
 * @typedef RemoveResult
 * @property {NodeIdentifier} v
 * @property {NodeIdentifier} w
 */

/**
 * @param {List[]} buckets 
 * @param {number} zeroIdx 
 * @param {GreedyFasNode} entry 
 */
function assignBucket(buckets, zeroIdx, entry) {
  if (!entry.out) {
    buckets[0].enqueue(entry);
  } else if (!entry.in) {
    buckets[buckets.length - 1].enqueue(entry);
  } else {
    buckets[entry.out - entry.in + zeroIdx].enqueue(entry);
  }
}

/**
 * 
 * @param {Graph<any, GreedyFasNode, number>} g 
 * @param {List[]} buckets 
 * @param {number} zeroIdx 
 * @param {GreedyFasNode} entry 
 * @param {boolean=} collectPredecessors 
 * @returns {RemoveResult[]|undefined}
 */
function removeNode(g, buckets, zeroIdx, entry, collectPredecessors) {
  /** @type RemoveResult[] */
  const results = collectPredecessors ? [] : undefined;

  const inEdges = g.inEdges(entry.v);
  if (inEdges) {
    inEdges.forEach((edge) => {
      const weight = g.edge(edge);
      const uEntry = g.node(edge.v);

      if (collectPredecessors) {
        results.push({ v: edge.v, w: edge.w });
      }

      uEntry.out -= weight;
      assignBucket(buckets, zeroIdx, uEntry);
    });
  }
  const outEdges = g.outEdges(entry.v);
  if (outEdges) {
    outEdges.forEach((edge) => {
      const weight = g.edge(edge);
      const { w } = edge;
      const wEntry = g.node(w);
      wEntry.in -= weight;
      assignBucket(buckets, zeroIdx, wEntry);
    });
  }
  g.removeNode(entry.v);
  return results;
}

/**
 * 
 * @param {Graph<any, GreedyFasNode, number>} g 
 * @param {List[]} buckets 
 * @param {number} zeroIdx 
 * @returns 
 */
function doGreedyFAS(g, buckets, zeroIdx) {
  let results = [];
  const sources = buckets[buckets.length - 1];
  const sinks = buckets[0];

  let entry;
  while (g.nodeCount()) {
    while ((entry = sinks.dequeue()))   { removeNode(g, buckets, zeroIdx, entry); }
    while ((entry = sources.dequeue())) { removeNode(g, buckets, zeroIdx, entry); }
    if (g.nodeCount()) {
      for (let i = buckets.length - 2; i > 0; --i) {
        entry = buckets[i].dequeue();
        if (entry) {
          results = results.concat(removeNode(g, buckets, zeroIdx, entry, true));
          break;
        }
      }
    }
  }

  return results;
}


/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g 
 * @param {(edge: Edge) => number} weightFn 
 * @returns {GreedyFasState}
 */
function buildState(g, weightFn) {
  /** @type {Graph<any, GreedyFasNode, number>} */ 
  const fasGraph = new Graph();
  let maxIn = 0;
  let maxOut = 0;

  const nodes = g.nodes();
  if (nodes) {
    nodes.forEach((v) => {
      fasGraph.setNode(v, { v, "in": 0, out: 0 });
    });
  }
  
  // Aggregate weights on nodes, but also sum the weights across multi-edges
  // into a single edge for the fasGraph.
  const edges = g.edges();
  if (edges) {
    edges.forEach((e) => {
      const prevWeight = fasGraph.edge(e.v, e.w) || 0;
      const weight = weightFn(e);
      const edgeWeight = prevWeight + weight;
      fasGraph.setEdge(e.v, e.w, edgeWeight);
      maxOut = Math.max(maxOut, fasGraph.node(e.v).out += weight);
      maxIn  = Math.max(maxIn,  fasGraph.node(e.w).in  += weight);
    });
  }
  const buckets = new Array(maxOut + maxIn + 3).fill(null).map(() => new List());
  const zeroIdx = maxIn + 1;

  const fNodes = fasGraph.nodes();
  if (fNodes) {
    fNodes.forEach((v) => {
      assignBucket(buckets, zeroIdx, fasGraph.node(v));
    });
  }
  return { graph: fasGraph, buckets, zeroIdx };
}

/**
 * @param {any[]} array The array to flatten.
 * @returns {Edge[]} Returns the new flattened array.
 */
function flatten(array) {
  const result = [];
  array.forEach((item) => {
    if (Array.isArray(item)) {
      item.forEach(i => result.push(i));
    } else {
      result.push(item);
    }
  });
  return result;
}


/**
 * A greedy heuristic for finding a feedback arc set for a graph. A feedback
 * arc set is a set of edges that can be removed to make a graph acyclic.
 * The algorithm comes from: P. Eades, X. Lin, and W. F. Smyth, "A fast and
 * effective heuristic for the feedback arc set problem." This implementation
 * adjusts that from the paper to allow for weighted edges.
 * 
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {(edge: Edge) => number=} weightFn 
 * @returns {Edge[]}
 */
export default function greedyFAS(g, weightFn) {
  if (g.nodeCount() <= 1) {
    return [];
  }
  const state = buildState(g, weightFn || DEFAULT_WEIGHT_FN);
  const results = doGreedyFAS(state.graph, state.buckets, state.zeroIdx);

  // Expand multi-edges
  const mapped = results.map(e => g.outEdges(e.v, e.w));
  return flatten(mapped);
  // return _.flatten(_.map(results, e => g.outEdges(e.v, e.w)), true);
}
