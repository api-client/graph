import { Graph } from "../Graph";
import { NodeIdentifier } from "../types";

export class CycleException extends Error {}

/**
 * Given a Graph graph this function applies topological sorting to it.
 * If the graph has a cycle it is impossible to generate such a list and CycleException is thrown.
 * Complexity: O(|V| + |E|).
 * 
 * @argument graph - graph to apply topological sorting to.
 * @returns an array of nodes such that for each edge u -> v, u appears before v in the array.
 */
export default function topSort<G, N, E>(g: Graph<G, N, E>): NodeIdentifier[];
