import { Graph } from '../../graph/Graph.js';
import { slack } from "./util.js";

/** @typedef {import('../../graph/types').NodeIdentifier} NodeIdentifier */
/** @typedef {import('../../graph/types').Edge} Edge */
/** @typedef {import('../types').LayoutNode} LayoutNode */
/** @typedef {import('../types').LayoutGraph} LayoutGraph */
/** @typedef {import('../types').LayoutEdge} LayoutEdge */

/**
 * Finds a maximal tree of tight edges and returns the number of nodes in the
 * tree.
 * 
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} t
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 */
function tightTree(t, g) {
  /**
   * @param {NodeIdentifier} v
   */
  function dfs(v) {
    const nodes = g.nodeEdges(v);
    if (!nodes) {
      return;
    }
    nodes.forEach((e) => {
      const edgeV = e.v;
      const w = (v === edgeV) ? e.w : edgeV;
      if (!t.hasNode(w) && !slack(g, e)) {
        t.setNode(w, {});
        t.setEdge(v, w, {});
        dfs(w);
      }
    });
  }
  const nodes = t.nodes();
  if (nodes) {
    nodes.forEach(dfs);
  }
  return t.nodeCount();
}

/**
 * Finds the edge with the smallest slack that is incident on tree and returns
 * it.
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} t
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @returns {Edge|undefined}
 */
function findMinSlackEdge(t, g) {
  const edges = g.edges();
  let minEdge;
  let minValue = Number.POSITIVE_INFINITY;
  if (!edges) {
    return minEdge;
  }
  edges.forEach((e) => {
    if (t.hasNode(e.v) !== t.hasNode(e.w)) {
      const slackResult = slack(g, e);
      if (slackResult < minValue) {
        minEdge = e;
        minValue = slackResult;
      }
    }
  });
  return minEdge;
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} t
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {number} delta
 */
function shiftRanks(t, g, delta) {
  const nodes = t.nodes();
  if (nodes) {
    nodes.forEach((v) => {
      const node = g.node(v);
      node.rank += delta;
    });
  }
}


/**
 * Constructs a spanning tree with tight edges and adjusted the input node's
 * ranks to achieve this. A tight edge is one that is has a length that matches
 * its "minLen" attribute.
 *
 * The basic structure for this function is derived from Gansner, et al., "A
 * Technique for Drawing Directed Graphs."
 *
 * Pre-conditions:
 *
 *    1. Graph must be a DAG.
 *    2. Graph must be connected.
 *    3. Graph must have at least one node.
 *    5. Graph nodes must have been previously assigned a "rank" property that
 *       respects the "minLen" property of incident edges.
 *    6. Graph edges must have a "minLen" property.
 *
 * Post-conditions:
 *
 *    - Graph nodes will have their rank adjusted to ensure that all edges are
 *      tight.
 *
 * Returns a tree (undirected graph) that is constructed using only "tight"
 * edges.
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 */
export default function feasibleTree(g) {
  const t = new Graph({ directed: false });
  // Choose arbitrary node from which to start our tree
  const start = g.nodes()[0];
  const size = g.nodeCount();
  t.setNode(start, {});

  let edge; let delta;
  while (tightTree(t, g) < size) {
    edge = findMinSlackEdge(t, g);
    delta = t.hasNode(edge.v) ? slack(g, edge) : -slack(g, edge);
    shiftRanks(t, g, delta);
  }
  return t;
}
