/** @typedef {import('../Graph').Graph} Graph */
/** @typedef {import('../types').NodeIdentifier} NodeIdentifier */

/**
 * @param {Graph} g 
 * @param {NodeIdentifier} v 
 * @param {boolean} postOrder 
 * @param {Record<NodeIdentifier, boolean>} visited 
 * @param {(v: NodeIdentifier) => NodeIdentifier[]} navigation 
 * @param {NodeIdentifier[]} acc 
 */
function doDfs(g, v, postOrder, visited, navigation, acc) {
  if (!visited[v]) {
    // eslint-disable-next-line no-param-reassign
    visited[v] = true;

    if (!postOrder) { 
      acc.push(v); 
    }
    navigation(v).forEach((w) => {
      doDfs(g, w, postOrder, visited, navigation, acc);
    });
    if (postOrder) { 
      acc.push(v);
    }
  }
}

/**
 * A helper that preforms a pre- or post-order traversal on the input graph
 * and returns the nodes in the order they were visited. If the graph is
 * undirected then this algorithm will navigate using neighbors. If the graph
 * is directed then this algorithm will navigate using successors.
 *
 * Order must be one of "pre" or "post".
 * 
 * @param {Graph} g
 * @param {NodeIdentifier|NodeIdentifier[]} vs
 * @param {'pre'|'post'} order
 * @returns {NodeIdentifier[]}
 */
export default function dfs(g, vs, order) {
  if (!Array.isArray(vs)) {
    // eslint-disable-next-line no-param-reassign
    vs = [vs];
  }

  const navigation = (g.isDirected() ? g.successors : g.neighbors).bind(g);

  const acc = [];
  /** @type Record<NodeIdentifier, boolean> */ 
  const visited = {};
  vs.forEach((v) => {
    if (!g.hasNode(v)) {
      throw new Error(`Graph does not have node: ${v}`);
    }
    doDfs(g, v, order === "post", visited, navigation, acc);
  });
  return acc;
}
