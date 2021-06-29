import { Graph } from "../Graph";
import { NodeIdentifier } from "../types";

/**
 * A helper that preforms a pre- or post-order traversal on the input graph
 * and returns the nodes in the order they were visited. If the graph is
 * undirected then this algorithm will navigate using neighbors. If the graph
 * is directed then this algorithm will navigate using successors.
 *
 * Order must be one of "pre" or "post".
 */
export default function dfs<G, N, E>(g: Graph<G, N, E>, vs: NodeIdentifier|NodeIdentifier[], order: 'pre'|'post'): NodeIdentifier[];
