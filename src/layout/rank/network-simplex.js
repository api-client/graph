/* eslint-disable no-cond-assign */
/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
import { Graph } from '../../graph/Graph.js';
import { preOrder, postOrder } from '../../graph/algorithms/index.js';
import feasibleTree from "./feasible-tree.js";
import { longestPath as initRank, slack } from './util.js';
import { simplify } from '../util.js';

/** @typedef {import('../../graph/types').NodeIdentifier} NodeIdentifier */
/** @typedef {import('../../graph/types').Edge} Edge */
/** @typedef {import('../types').LayoutNode} LayoutNode */
/** @typedef {import('../types').LayoutGraph} LayoutGraph */
/** @typedef {import('../types').LayoutEdge} LayoutEdge */

/**
 * Returns true if the edge is in the tree.
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} tree
 * @param {NodeIdentifier} u
 * @param {NodeIdentifier} v
 */
function isTreeEdge(tree, u, v) {
  return tree.hasEdge(u, v);
}

/**
 * Given the tight tree, its graph, and a child in the graph calculate and
 * return the cut value for the edge between the child and its parent.
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} t
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {NodeIdentifier} child
 */
export function calcCutValue(t, g, child) {
  const childLab = t.node(child);
  const { parent } = childLab;
  // True if the child is on the tail end of the edge in the directed graph
  let childIsTail = true;
  // The graph's view of the tree edge we're inspecting
  let graphEdge = g.edge(child, parent);
  // The accumulated cut value for the edge between this node and its parent
  let cutValue = 0;

  if (!graphEdge) {
    childIsTail = false;
    graphEdge = g.edge(parent, child);
  }
  cutValue = graphEdge.weight;

  const nodes = g.nodeEdges(child);
  if (nodes) {
    nodes.forEach((e) => {
      const isOutEdge = e.v === child;
      const other = isOutEdge ? e.w : e.v;
  
      if (other !== parent) {
        const pointsToHead = isOutEdge === childIsTail;
          const otherWeight = g.edge(e).weight;
  
        cutValue += pointsToHead ? otherWeight : -otherWeight;
        if (isTreeEdge(t, child, other)) {
          const otherCutValue = t.edge(child, other).cutValue;
          cutValue += pointsToHead ? -otherCutValue : otherCutValue;
        }
      }
    });
  }
  return cutValue;
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} t
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {NodeIdentifier} child
 */
function assignCutValue(t, g, child) {
  const childLab = t.node(child);
  const { parent } = childLab;
  t.edge(child, parent).cutValue = calcCutValue(t, g, child);
}

/**
 * Initializes cut values for all edges in the tree.
 * 
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} t
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 */
export function initCutValues(t, g) {
  let vs = postOrder(t, t.nodes());
  vs = vs.slice(0, vs.length - 1);
  vs.forEach((v) => {
    assignCutValue(t, g, v);
  });
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} tree
 * @param {Record<NodeIdentifier, boolean>} visited
 * @param {number} nextLim
 * @param {NodeIdentifier} v
 * @param {NodeIdentifier=} parent
 * @returns {number} 
 */
function dfsAssignLowLim(tree, visited, nextLim, v, parent) {
  const low = nextLim;
  const label = tree.node(v);

  visited[v] = true;

  const nodes = tree.neighbors(v);
  if (nodes) {
    nodes.forEach((w) => {
      if (!visited[w]) {
        nextLim = dfsAssignLowLim(tree, visited, nextLim, w, v);
      }
    });
  }

  label.low = low;
  label.lim = nextLim++;
  if (parent) {
    label.parent = parent;
  } else {
    // TODO should be able to remove this when we incrementally update low lim
    delete label.parent;
  }
  return nextLim;
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} tree
 * @param {NodeIdentifier=} root
 */
export function initLowLimValues(tree, root) {
  if (!root) {
    [root] = tree.nodes();
  }
  dfsAssignLowLim(tree, {}, 1, root);
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} tree
 * @returns {Edge} 
 */
export function leaveEdge(tree) {
  const edges = tree.edges() || [];
  return edges.find(e => tree.edge(e).cutValue < 0);
}

/**
 * Returns true if the specified node is descendant of the root node per the
 * assigned low and lim attributes in the tree.
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} tree
 * @param {any} vLabel
 * @param {any} rootLabel
 * @returns {boolean}
 */
function isDescendant(tree, vLabel, rootLabel) {
  return rootLabel.low <= vLabel.lim && vLabel.lim <= rootLabel.lim;
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} t
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {Edge} edge
 * @returns {Edge|undefined} 
 */
export function enterEdge(t, g, edge) {
  let { v, w } = edge;

  // For the rest of this function we assume that v is the tail and w is the
  // head, so if we don't have this edge in the graph we should flip it to
  // match the correct orientation.
  if (!g.hasEdge(v, w)) {
    v = edge.w;
    w = edge.v;
  }

  const vLabel = t.node(v);
  const wLabel = t.node(w);
  let tailLabel = vLabel;
  let flip = false;

  // If the root is in the tail of the edge then we need to flip the logic that
  // checks for the head and tail nodes in the candidates function below.
  if (vLabel.lim > wLabel.lim) {
    tailLabel = wLabel;
    flip = true;
  }

  const edges = g.edges() || [];
  const candidates = edges.filter(e => flip === isDescendant(t, t.node(e.v), tailLabel) && flip !== isDescendant(t, t.node(e.w), tailLabel));
  let result;
  let minValue = Number.POSITIVE_INFINITY;
  candidates.forEach((e) => {
    const rank = slack(g, e);
    if (rank < minValue) {
      result = e;
      minValue = rank;
    }
  });
  return result;
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} t
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 */
function updateRanks(t, g) {
  const nodes = t.nodes();
  const root = nodes.find(v => !g.node(v).parent);
  let vs = preOrder(t, root);
  vs = vs.slice(1);
  vs.forEach((v) => {
    const { parent } = t.node(v);
    let edge = g.edge(v, parent);
    let flipped = false;

    if (!edge) {
      edge = g.edge(parent, v);
      flipped = true;
    }

    g.node(v).rank = g.node(parent).rank + (flipped ? edge.minLen : -edge.minLen);
  });
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} t
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {Edge} e
 * @param {Edge} f
 */
export function exchangeEdges(t, g, e, f) {
  const { v, w } = e;
  t.removeEdge(v, w);
  t.setEdge(f.v, f.w, {});
  initLowLimValues(t);
  initCutValues(t, g);
  updateRanks(t, g);
}


/**
 * The network simplex algorithm assigns ranks to each node in the input graph
 * and iteratively improves the ranking to reduce the length of edges.
 *
 * Preconditions:
 *
 *    1. The input graph must be a DAG.
 *    2. All nodes in the graph must have an object value.
 *    3. All edges in the graph must have "minLen" and "weight" attributes.
 *
 * Postconditions:
 *
 *    1. All nodes in the graph will have an assigned "rank" attribute that has
 *       been optimized by the network simplex algorithm. Ranks start at 0.
 *
 *
 * A rough sketch of the algorithm is as follows:
 *
 *    1. Assign initial ranks to each node. We use the longest path algorithm,
 *       which assigns ranks to the lowest position possible. In general this
 *       leads to very wide bottom ranks and unnecessarily long edges.
 *    2. Construct a feasible tight tree. A tight tree is one such that all
 *       edges in the tree have no slack (difference between length of edge
 *       and minLen for the edge). This by itself greatly improves the assigned
 *       rankings by shorting edges.
 *    3. Iteratively find edges that have negative cut values. Generally a
 *       negative cut value indicates that the edge could be removed and a new
 *       tree edge could be added to produce a more compact graph.
 *
 * Much of the algorithms here are derived from Gansner, et al., "A Technique
 * for Drawing Directed Graphs." The structure of the file roughly follows the
 * structure of the overall algorithm.
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 */
export default function networkSimplex(g) {
  const graph = simplify(g);
  initRank(graph);
  const t = feasibleTree(graph);
  initLowLimValues(t);
  initCutValues(t, graph);

  let e; let f;
  while ((e = leaveEdge(t))) {
    f = enterEdge(t, graph, e);
    exchangeEdges(t, graph, e, f);
  }
}

// // Expose some internals for testing purposes
// networkSimplex.initLowLimValues = initLowLimValues;
// networkSimplex.initCutValues = initCutValues;
// networkSimplex.calcCutValue = calcCutValue;
// networkSimplex.leaveEdge = leaveEdge;
// networkSimplex.enterEdge = enterEdge;
// networkSimplex.exchangeEdges = exchangeEdges;
