/* eslint-disable no-unused-vars */
import { Graph } from '../../graph/Graph.js';

/** @typedef {import('../../graph/types').NodeIdentifier} NodeIdentifier */
/** @typedef {import('../types').LayoutNode} LayoutNode */
/** @typedef {import('../types').LayoutGraph} LayoutGraph */
/** @typedef {import('../types').LayoutEdge} LayoutEdge */

/**
 * Assigns an initial order value for each node by performing a DFS search
 * starting from nodes in the first rank. Nodes are assigned an order in their
 * rank as they are first visited.
 *
 * This approach comes from Gansner, et al., "A Technique for Drawing Directed
 * Graphs."
 *
 * Returns a layering matrix with an array per layer and each layer sorted by
 * the order of its nodes.
 * 
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @returns {NodeIdentifier[][]}
 */
export default function initOrder(g) {
  const visited = {};
  const simpleNodes = g.nodes().filter(v => !g.children(v).length);
  const maxRank = Math.max(...simpleNodes.map(v => g.node(v).rank));
  const layers = new Array(maxRank + 1).fill(0).map(() => []);
  /**
   * @param {NodeIdentifier} v
   */
  function dfs(v) {
    if (visited[v]) {
      return;
    }
    visited[v] = true;
    const node = g.node(v);
    layers[node.rank].push(v);
    (g.successors(v) || []).forEach(dfs);
  }

  const orderedVs = [...simpleNodes].sort((a, b) => {
    const ra = g.node(a).rank;
    const rb = g.node(b).rank;
    return ra - rb;
  });
  orderedVs.forEach(dfs);
  return layers;
}
