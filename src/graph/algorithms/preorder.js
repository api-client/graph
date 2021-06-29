import dfs from "./dfs.js";

/** @typedef {import('../Graph').Graph} Graph */
/** @typedef {import('../types').NodeIdentifier} NodeIdentifier */

/**
 * @param {Graph} g 
 * @param {NodeIdentifier|NodeIdentifier[]} vs 
 * @returns {NodeIdentifier[]}
 */
export default function preOrder(g, vs) {
  return dfs(g, vs, "pre");
}
