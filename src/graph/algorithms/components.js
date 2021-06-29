/** @typedef {import('../Graph').Graph} Graph */
/** @typedef {import('../types').NodeIdentifier} NodeIdentifier */

/**
 * Finds all connected components in a graph and returns an array of these components.
 * Each component is itself an array that contains the ids of nodes in the component.
 * Complexity: O(|V|).
 * 
 * @param {Graph} g graph to find components in.
 * @returns {NodeIdentifier[][]} array of nodes list representing components
 */
export default function components(g) {

  /** @type Record<NodeIdentifier, boolean> */
  const visited = {};
  /** @type NodeIdentifier[][] */
  const result = [];
  /** @type NodeIdentifier[] */
  let cmp;

  /**
   * @param {NodeIdentifier} v 
   */
  function dfs(v) {
    if (visited[v]) {
      return;
    }
    visited[v] = true;
    cmp.push(v);
    const ss = g.successors(v);
    if (Array.isArray(ss)) {
      ss.forEach(dfs);
    }
    const ps = g.predecessors(v);
    if (Array.isArray(ps)) {
      ps.forEach(dfs);
    }
  }

  g.nodes().forEach((v) => {
    cmp = [];
    dfs(v);
    if (cmp.length) {
      result.push(cmp);
    }
  });

  return result;
}
