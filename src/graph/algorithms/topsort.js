/** @typedef {import('../Graph').Graph} Graph */
/** @typedef {import('../types').NodeIdentifier} NodeIdentifier */

export class CycleException extends Error {}

/**
 * @param {Graph} g 
 * @returns {NodeIdentifier[]}
 */
export default function topSort(g) {
  const visited = {};
  const stack = {};
  /** @type NodeIdentifier[] */
  const results = [];

  /**
   * 
   * @param {NodeIdentifier} node 
   */
  function visit(node) {
    if (stack[node]) {
      throw new CycleException();
    }

    if (!visited[node]) {
      stack[node] = true;
      visited[node] = true;
      const pre = g.predecessors(node);
      if (pre) {
        pre.forEach(id => visit(id))
      }
      delete stack[node];
      results.push(node);
    }
  }

  g.sinks().forEach(id => visit(id));
  
  if (Object.keys(visited).length !== g.nodeCount()) {
    throw new CycleException();
  }

  return results;
}
