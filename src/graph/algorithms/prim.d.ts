import { Graph } from "../Graph";
import { Edge } from "../types";

/**
 * Prim's algorithm takes a connected undirected graph and generates a minimum spanning tree. This
 * function returns the minimum spanning tree as an undirected graph. This algorithm is derived
 * from the description in "Introduction to Algorithms", Third Edition, Cormen, et al., Pg 634.
 * Complexity: O(|E| * log |V|);
 *
 * @argument graph graph to generate a minimum spanning tree of.
 * @argument weightFn function which takes edge e and returns the weight of it. 
 * It throws an Error if the graph is not connected.
 * @returns minimum spanning tree of graph.
 */
export default function prim<G, N, E>(g: Graph<G, N, E>, weightFunc: (edge: Edge<E>) => number): Graph<G, N, E>;
