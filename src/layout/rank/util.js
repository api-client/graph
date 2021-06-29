/* eslint-disable no-unused-vars */
import { Graph } from '../../graph/Graph.js';

/** @typedef {import('../../graph/types').Edge} Edge */
/** @typedef {import('../../graph/types').NodeIdentifier} NodeIdentifier */
/** @typedef {import('../types').LayoutNode} LayoutNode */
/** @typedef {import('../types').LayoutGraph} LayoutGraph */
/** @typedef {import('../types').LayoutEdge} LayoutEdge */

/**
 * Initializes ranks for the input graph using the longest path algorithm. This
 * algorithm scales well and is fast in practice, it yields rather poor
 * solutions. Nodes are pushed to the lowest layer possible, leaving the bottom
 * ranks wide and leaving edges longer than necessary. However, due to its
 * speed, this algorithm is good for getting an initial ranking that can be fed
 * into other algorithms.
 *
 * This algorithm does not normalize layers because it will be used by other
 * algorithms in most cases. If using this algorithm directly, be sure to
 * run normalize at the end.
 *
 * Pre-conditions:
 *
 *    1. Input graph is a DAG.
 *    2. Input graph node labels can be assigned properties.
 *
 * Post-conditions:
 *
 *    1. Each node will be assign an (un-normalized) "rank" property.
 * 
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 */
export function longestPath(g) {
  const visited = {};

  /**
   * @param {NodeIdentifier} v
   * @returns {number} 
   */
  function dfs(v) {
    const label = g.node(v);
    if (visited[v]) {
      return label.rank;
    }
    visited[v] = true;
    let rank = Number.POSITIVE_INFINITY;
    const edges = g.outEdges(v);
    if (edges) {
      const ranks = edges.map(e => dfs(e.w) - g.edge(e).minLen);
      ranks.forEach((value) => {
        if (value < rank) {
          rank = value;
        }
      })
    }
    if (rank === Number.POSITIVE_INFINITY) {
      rank = 0;
    }
    label.rank = rank;
    return rank;
  }
  const src = g.sources();
  if (src) {
    src.forEach(dfs);
  }
}

/**
 * Returns the amount of slack for the given edge. The slack is defined as the
 * difference between the length of the edge and its minimum length.
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {Edge} e
 * @returns {number}
 */
export function slack(g, e) {
  return g.node(e.w).rank - g.node(e.v).rank - g.edge(e).minLen;
}
