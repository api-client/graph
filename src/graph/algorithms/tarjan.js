/* eslint-disable no-plusplus */

/** @typedef {import('../Graph').Graph} Graph */
/** @typedef {import('../types').NodeIdentifier} NodeIdentifier */

/**
 * 
 * @param {Graph} g 
 * @returns {NodeIdentifier[][]}
 */
export default function tarjan(g) {
  let index = 0;
  /** @type NodeIdentifier[] */
  const stack = [];
  const visited = {}; // node id -> { onStack, lowLink, index }
  /** @type NodeIdentifier[][] */
  const results = [];

  /**
   * @param {NodeIdentifier} v 
   */
  function dfs(v) {
    const entry = {
      onStack: true,
      lowLink: index,
      index: index++
    };
    visited[v] = entry;
    stack.push(v);

    g.successors(v).forEach((w) => {
      if (!visited[w]) {
        dfs(w);
        entry.lowLink = Math.min(entry.lowLink, visited[w].lowLink);
      } else if (visited[w].onStack) {
        entry.lowLink = Math.min(entry.lowLink, visited[w].index);
      }
    });

    if (entry.lowLink === entry.index) {
      const cmp = [];
      let w;
      do {
        w = stack.pop();
        visited[w].onStack = false;
        cmp.push(w);
      } while (v !== w);
      results.push(cmp);
    }
  }

  g.nodes().forEach((v) => {
    if (!visited[v]) {
      dfs(v);
    }
  });

  return results;
}
