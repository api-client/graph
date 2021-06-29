import dijkstra from "./dijkstra.js";

/** @typedef {import('../Graph').Graph} Graph */
/** @typedef {import('../types').NodeIdentifier} NodeIdentifier */
/** @typedef {import('../types').Edge} Edge */
/** @typedef {import('../types').NodePath} NodePath */

/**
 * This function finds the shortest path from each node to every other reachable node in
 * the graph. It is similar to alg.dijkstra, but instead of returning a single-source
 * array, it returns a mapping of source -> alg.dijksta(g, source, weightFn, edgeFn).
 * Complexity: O(|V| * (|E| + |V|) * log |V|).
 * 
 * @param {Graph} g 
 * @param {(edge: Edge) => number=} weightFunc 
 * @param {(v: NodeIdentifier) => Edge[]=} edgeFunc 
 * @returns {Record<NodeIdentifier, Record<NodeIdentifier, NodePath>>}
 */
export default function dijkstraAll(g, weightFunc, edgeFunc) {
  /** @type Record<NodeIdentifier, Record<NodeIdentifier, NodePath>> */
  const result = {};
  const ids = g.nodes();
  ids.forEach((id) => {
    result[id] = dijkstra(g, id, weightFunc, edgeFunc);
  });
  return result;
}
