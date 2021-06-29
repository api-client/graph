import { PriorityQueue } from '../../data/PriorityQueue.js';

/** @typedef {import('../Graph').Graph} Graph */
/** @typedef {import('../types').Edge} Edge */
/** @typedef {import('../types').NodeIdentifier} NodeIdentifier */
/** @typedef {import('../types').NodePath} NodePath */

const DEFAULT_WEIGHT_FUNC = () => 1;

/**
 * 
 * @param {Graph} g 
 * @param {string} source 
 * @param {(edge: Edge) => number} weightFn 
 * @param {(v: NodeIdentifier) => Edge[]} edgeFn 
 * @returns {Record<NodeIdentifier, NodePath>}
 */
function runDijkstra(g, source, weightFn, edgeFn) {
  /** @type {Record<NodeIdentifier, NodePath>} */
  const results = {};
  const pq = new PriorityQueue();
  let v; 
  /** @type NodePath */
  let vEntry;

  /**
   * @param {Edge} edge 
   */
  const updateNeighbors = (edge) => {
    const w = edge.v !== v ? edge.v : edge.w;
    const wEntry = results[w];
    const weight = weightFn(edge);
    const distance = vEntry.distance + weight;

    if (weight < 0) {
      throw new Error(`${"dijkstra does not allow negative edge weights. " +
                      "Bad edge: "}${  edge  } Weight: ${  weight}`);
    }

    if (distance < wEntry.distance) {
      wEntry.distance = distance;
      wEntry.predecessor = v;
      pq.decrease(w, distance);
    }
  };

  g.nodes().forEach((id) => {
    const distance = id === source ? 0 : Number.POSITIVE_INFINITY;
    results[id] = { distance };
    pq.add(id, distance);
  });

  while (pq.size() > 0) {
    v = pq.removeMin();
    vEntry = results[v];
    if (vEntry.distance === Number.POSITIVE_INFINITY) {
      break;
    }

    edgeFn(v).forEach(updateNeighbors);
  }

  return results;
}

/**
 * This function is an implementation of Dijkstra's algorithm which finds the shortest
 * path from source to all other nodes in graph. This function returns a map of
 * v -> { distance, predecessor }. The distance property holds the sum of the weights
 * from source to v along the shortest path or Number.POSITIVE_INFINITY if there is no path
 * from source. The predecessor property can be used to walk the individual elements of the
 * path from source to v in reverse order.
 * Complexity: O((|E| + |V|) * log |V|).
 * 
 * @param {Graph} g - graph where to search paths.
 * @param {NodeIdentifier} source node to start paths from.
 * @param {((edge: Edge) => number)=} weightFn function which takes edge e and returns the weight of it. If no weightFn
 * is supplied then each edge is assumed to have a weight of 1. This function throws an
 * Error if any of the traversed edges have a negative edge weight.
 * @param {((v: NodeIdentifier) => Edge[])=} edgeFn function which takes a node v and returns the ids of all edges incident to it
 * for the purposes of shortest path traversal. By default this function uses the graph.outEdges.
 * @returns {Record<NodeIdentifier, NodePath>} shortest paths map that starts from node source
 */
export default function dijkstra(g, source, weightFn, edgeFn) {
  return runDijkstra(g, String(source), weightFn || DEFAULT_WEIGHT_FUNC, edgeFn || (v => g.outEdges(v)));
}
