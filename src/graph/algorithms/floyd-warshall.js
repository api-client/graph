const DEFAULT_WEIGHT_FUNC = () => 1;

/** @typedef {import('../Graph').Graph} Graph */
/** @typedef {import('../types').NodeIdentifier} NodeIdentifier */
/** @typedef {import('../types').Edge} Edge */
/** @typedef {import('../types').FloydWarshallResult} FloydWarshallResult */

/**
 * @param {Graph} g 
 * @param {(edge: Edge) => number} weightFn 
 * @param {(v: NodeIdentifier) => Edge[]} edgeFn 
 * @returns {FloydWarshallResult}
 */
function runFloydWarshall(g, weightFn, edgeFn) {
  const results = /** @type FloydWarshallResult */ ({});
  const nodes = g.nodes();

  nodes.forEach((v) => {
    results[v] = {};
    results[v][v] = { distance: 0 };
    nodes.forEach((w) => {
      if (v !== w) {
        results[v][w] = { distance: Number.POSITIVE_INFINITY };
      }
    });
    edgeFn(v).forEach((edge) => {
      const w = edge.v === v ? edge.w : edge.v;
      const d = weightFn(edge);
      results[v][w] = { distance: d, predecessor: v };
    });
  });

  nodes.forEach((k) => {
    const rowK = results[k];
    nodes.forEach((i) => {
      const rowI = results[i];
      nodes.forEach((j) => {
        const ik = rowI[k];
        const kj = rowK[j];
        const ij = rowI[j];
        const altDistance = ik.distance + kj.distance;
        if (altDistance < ij.distance) {
          ij.distance = altDistance;
          ij.predecessor = kj.predecessor;
        }
      });
    });
  });

  return results;
}

/**
 * This function is an implementation of the Floyd-Warshall algorithm, which finds the
 * shortest path from each node to every other reachable node in the graph. It is similar
 * to alg.dijkstraAll, but it handles negative edge weights and is more efficient for some types
 * of graphs. This function returns a map of source -> { target -> { distance, predecessor }.
 * The distance property holds the sum of the weights from source to target along the shortest
 * path of Number.POSITIVE_INFINITY if there is no path from source. The predecessor property
 * can be used to walk the individual elements of the path from source to target in reverse
 * order.
 * Complexity: O(|V|^3).
 * 
 * @param {Graph} g 
 * @param {(edge: Edge) => number=} weightFn 
 * @param {(v: NodeIdentifier) => Edge[]=} edgeFn 
 * @returns {FloydWarshallResult}
 */
export default function floydWarshall(g, weightFn, edgeFn) {
  return runFloydWarshall(g, weightFn || DEFAULT_WEIGHT_FUNC, edgeFn || (v => g.outEdges(v)));
}
