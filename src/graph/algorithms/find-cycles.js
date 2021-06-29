import tarjan from "./tarjan.js";

/** @typedef {import('../Graph').Graph} Graph */
/** @typedef {import('../types').NodeIdentifier} NodeIdentifier */

/**
 * Given a Graph, graph, this function returns all nodes that are part of a cycle. As there
 * may be more than one cycle in a graph this function return an array of these cycles,
 * where each cycle is itself represented by an array of ids for each node involved in
 * that cycle. Method alg.isAcyclic is more efficient if you only need to determine whether a graph has a
 * cycle or not.
 * Complexity: O(|V| + |E|).
 * 
 * @param {Graph} g graph where to search cycles.
 * @returns {NodeIdentifier[][]} cycles list.
 */
export default function findCycles(g) {
  const items = tarjan(g);
  return items.filter(cmp => cmp.length > 1 || (cmp.length === 1 && g.hasEdge(cmp[0], cmp[0])));
}
