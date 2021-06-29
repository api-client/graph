/* eslint-disable no-unused-vars */
/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
import { Graph } from '../graph/Graph.js';
import { addDummyNode } from './util.js';

/** @typedef {import('../graph/types').NodeIdentifier} NodeIdentifier */
/** @typedef {import('./types').LayoutNode} LayoutNode */
/** @typedef {import('./types').LayoutGraph} LayoutGraph */
/** @typedef {import('./types').LayoutEdge} LayoutEdge */
/** @typedef {import('./types').BorderedNode} BorderedNode */

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {string} prop
 * @param {string} prefix
 * @param {NodeIdentifier} sg
 * @param {any} sgNode
 * @param {number} rank
 */
function addBorderNode(g, prop, prefix, sg, sgNode, rank) {
  const label = { width: 0, height: 0, rank, borderType: prop };
  const prev = sgNode[prop][rank - 1];
  const curr = addDummyNode(g, "border", label, prefix);
  sgNode[prop][rank] = curr;
  g.setParent(curr, sg);
  if (prev) {
    g.setEdge(prev, curr, { weight: 1 });
  }
}

/**
 * @param {Graph<LayoutGraph, BorderedNode, LayoutEdge>} g
 */
export default function addBorderSegments(g) {
  /**
   * @param {NodeIdentifier} v
   */
  function dfs(v) {
    const children = g.children(v);
    const node = g.node(v);
    if (children) {
      children.forEach(dfs);
    }

    if (typeof node.minRank === 'number') {
      node.borderLeft = [];
      node.borderRight = [];
      for (let rank = node.minRank, maxRank = node.maxRank + 1; rank < maxRank; ++rank) {
        addBorderNode(g, "borderLeft", "_bl", v, node, rank);
        addBorderNode(g, "borderRight", "_br", v, node, rank);
      }
    }
  }
  const children = g.children();
  if (children) {
    children.forEach(dfs);
  }
}
