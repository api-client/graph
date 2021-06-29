/* eslint-disable no-unused-vars */
import { Graph } from '../../graph/Graph.js';

/** @typedef {import('../../graph/types').NodeIdentifier} NodeIdentifier */
/** @typedef {import('../types').LayoutNode} LayoutNode */
/** @typedef {import('../types').LayoutGraph} LayoutGraph */
/** @typedef {import('../types').LayoutEdge} LayoutEdge */

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} cg
 * @param {NodeIdentifier[]} vs
 */
export default function addSubgraphConstraints(g, cg, vs) {
  /** @type Record<NodeIdentifier, NodeIdentifier> */
  const prev = {};
  let rootPrev;

  vs.forEach((v) => {
    let child = g.parent(v);
    /** @type NodeIdentifier */
    let parent;
    /** @type NodeIdentifier */
    let prevChild;
    while (child) {
      parent = g.parent(child);
      if (parent) {
        prevChild = prev[parent];
        prev[parent] = child;
      } else {
        prevChild = rootPrev;
        rootPrev = child;
      }
      if (prevChild && prevChild !== child) {
        cg.setEdge(prevChild, child);
        return;
      }
      child = parent;
    }
  });

  /*
  function dfs(v) {
    var children = v ? g.children(v) : g.children();
    if (children.length) {
      var min = Number.POSITIVE_INFINITY,
          subgraphs = [];
      _.each(children, function(child) {
        var childMin = dfs(child);
        if (g.children(child).length) {
          subgraphs.push({ v: child, order: childMin });
        }
        min = Math.min(min, childMin);
      });
      _.reduce(_.sortBy(subgraphs, "order"), function(prev, curr) {
        cg.setEdge(prev.v, curr.v);
        return curr;
      });
      return min;
    }
    return g.node(v).order;
  }
  dfs(undefined);
  */
}