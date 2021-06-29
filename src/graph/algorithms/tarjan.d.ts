import { Graph } from "../Graph";
import { NodeIdentifier } from "../types";

/**
 * This function is an implementation of Tarjan's algorithm which finds all strongly connected
 * components in the directed graph g. Each strongly connected component is composed of nodes that
 * can reach all other nodes in the component via directed edges. A strongly connected component
 * can consist of a single node if that node cannot both reach and be reached by any other
 * specific node in the graph. Components of more than one node are guaranteed to have at least
 * one cycle.
 * Complexity: O(|V| + |E|).
 *
 * @argument graph - graph to find all strongly connected components of.
 * @return an array of components. Each component is itself an array that contains
 * the ids of all nodes in the component.
 */
export default function tarjan<G, N, E>(g: Graph<G, N, E>): NodeIdentifier[][];
