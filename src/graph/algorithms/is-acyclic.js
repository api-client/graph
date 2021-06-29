import topSort, { CycleException } from "./topsort.js";

/** @typedef {import('../Graph').Graph} Graph */

/**
 * Given a Graph, graph, this function returns true if the graph has no cycles and returns false if it
 * does. This algorithm returns as soon as it detects the first cycle. You can use alg.findCycles
 * to get the actual list of cycles in the graph.
 * 
 * @param {Graph} g 
 * @returns {boolean}
 */
export default function isAcyclic(g) {
  try {
    topSort(g);
  } catch (e) {
    if (e instanceof CycleException) {
      return false;
    }
    throw e;
  }
  return true;
}
