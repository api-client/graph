/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable no-cond-assign */
import { Graph } from '../graph/Graph.js';

/** @typedef {import('../graph/types').NodeIdentifier} NodeIdentifier */
/** @typedef {import('./types').LayoutNode} LayoutNode */
/** @typedef {import('./types').LayoutGraph} LayoutGraph */
/** @typedef {import('./types').LayoutEdge} LayoutEdge */

/**
 * Finds a path from v to w through the lowest common ancestor (LCA). 
 * 
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {Record<NodeIdentifier, any>} postOrderNumbers
 * @param {NodeIdentifier} v
 * @param {NodeIdentifier} w
 * @return {{path: NodeIdentifier[], lca: NodeIdentifier}} the full path and the LCA.
 */
function findPath(g, postOrderNumbers, v, w) {
  const vPath = [];
  const wPath = [];
  const low = Math.min(postOrderNumbers[v].low, postOrderNumbers[w].low);
  const lim = Math.max(postOrderNumbers[v].lim, postOrderNumbers[w].lim);
  let parent;

  // Traverse up from v to find the LCA
  parent = v;
  do {
    parent = g.parent(parent);
    vPath.push(parent);
  } while (parent &&
           (postOrderNumbers[parent].low > low || lim > postOrderNumbers[parent].lim));
  const lca = parent;

  // Traverse from w to LCA
  parent = w;
  while ((parent = g.parent(parent)) !== lca) {
    wPath.push(parent);
  }

  return { 
    path: vPath.concat(wPath.reverse()), 
    lca 
  };
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @return {Record<NodeIdentifier, {low: number, lim: number}>} 
 */
function postOrder(g) {
  const result = /** @type Record<NodeIdentifier, {low: number, lim: number}> */ ({});
  let lim = 0;

  /**
   * @param {NodeIdentifier} v
   */
  function dfs(v) {
    const low = lim;
    const children = g.children(v);
    if (children) {
      children.forEach(dfs);
    }
    result[v] = { low, lim: lim++ };
  }
  const children = g.children();
  if (children) {
    children.forEach(dfs);
  }

  return result;
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 */
export default function parentDummyChains(g) {
  const postOrderNumbers = postOrder(g);
  const { dummyChains } = g.graph();
  if (Array.isArray(dummyChains)) {
    dummyChains.forEach((v) => {
      let node = g.node(v);
      const { edgeObj } = node;
      const pathData = findPath(g, postOrderNumbers, edgeObj.v, edgeObj.w);
      const { path, lca } = pathData;
      let pathIdx = 0;
      let pathV = path[pathIdx];
      let ascending = true;

      while (v !== edgeObj.w) {
        node = g.node(v);

        if (ascending) {
          while ((pathV = path[pathIdx]) !== lca && g.node(pathV).maxRank < node.rank) {
            pathIdx++;
          }

          if (pathV === lca) {
            ascending = false;
          }
        }

        if (!ascending) {
          while (pathIdx < path.length - 1 && g.node(pathV = path[pathIdx + 1]).minRank <= node.rank) {
            pathIdx++;
          }
          pathV = path[pathIdx];
        }

        g.setParent(v, pathV);
        [v] = g.successors(v);
      }
    });
  }
}
