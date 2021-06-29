import { Graph } from "../Graph";
import { Edge, FloydWarshallResult, NodeIdentifier } from "../types";

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
 * @argument graph - graph where to search pathes.
 * @argument weightFn - function which takes edge e and returns the weight of it. If no weightFn
 * is supplied then each edge is assumed to have a weight of 1. This function throws an
 * Error if any of the traversed edges have a negative edge weight.
 * @argument edgeFn - function which takes a node v and returns the ids of all edges incident to it
 * for the purposes of shortest path traversal. By default this function uses the graph.outEdges.
 * @returns shortest pathes map.
 */
export default function floydWarshall<G, N, E>(g: Graph<G, N, E>, weightFn?: (edge: Edge<E>) => number, edgeFn?: (v: NodeIdentifier) => Edge<E>[]): FloydWarshallResult;
