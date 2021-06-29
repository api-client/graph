import { Graph } from "../Graph";

/**
 * Given a Graph, graph, this function returns true if the graph has no cycles and returns false if it
 * does. This algorithm returns as soon as it detects the first cycle. You can use alg.findCycles
 * to get the actual list of cycles in the graph.
 * 
 * @argument graph graph to detect whether it acyclic ot not.
 * @returns whether graph contain cycles or not.
 */
export default function isAcyclic<G, N, E>(g: Graph<G, N, E>): boolean;
