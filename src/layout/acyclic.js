/* eslint-disable no-unused-vars */
import { Graph } from '../graph/Graph.js';
import greedyFAS from "./greedy-fas.js";
import { uniqueId } from "./util.js";

/** @typedef {import('../graph/types').NodeIdentifier} NodeIdentifier */
/** @typedef {import('../graph/types').Edge} Edge */
/** @typedef {import('./types').LayoutNode} LayoutNode */
/** @typedef {import('./types').LayoutGraph} LayoutGraph */
/** @typedef {import('./types').LayoutEdge} LayoutEdge */


/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g 
 * @returns {Edge[]}
 */
function dfsFAS(g) {
  /** @type Edge[] */
  const fas = [];
  /** @type Record<NodeIdentifier, boolean> */
  const stack = {};
  /** @type Record<NodeIdentifier, boolean> */
  const visited = {};

  /**
   * @param {NodeIdentifier} v
   */
  function dfs(v) {
    const has = Object.prototype.hasOwnProperty.call(visited, v);
    if (has) {
      return;
    }
    visited[v] = true;
    stack[v] = true;
    const oEdges = g.outEdges(v);
    if (oEdges) {
      oEdges.forEach((e) => {
        const hasStack = Object.prototype.hasOwnProperty.call(stack, e.w);
        if (hasStack) {
          fas.push(e);
        } else {
          dfs(e.w);
        }
      });
    }
    delete stack[v];
  }
  const nodes = g.nodes();
  if (nodes) {
    nodes.forEach(n => dfs(n));
  }
  return fas;
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g 
 */
export function run(g) {
  /**
   * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} graph
   * @returns {(edge: Edge) => number}
   */
  function weightFn(graph) {
    /**
     * @param {Edge} e
     * @return {number} 
     */
    return e => graph.edge(e).weight;
  }

  const fas = (g.graph().acyclicer === "greedy" ? greedyFAS(g, weightFn(g)) : dfsFAS(g));
  if (Array.isArray(fas)) {
    fas.forEach((e) => {
      const label = g.edge(e);
      g.removeEdge(e);
      label.forwardName = e.name;
      label.reversed = true;
      g.setEdge(e.w, e.v, label, uniqueId('rev'));
    });
  }
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g 
 */
export function undo(g) {
  const edges = g.edges();
  if (edges) {
    edges.forEach((e) => {
      const label = g.edge(e);
      if (label.reversed) {
        g.removeEdge(e);
  
        const { forwardName } = label;
        delete label.reversed;
        delete label.forwardName;
        g.setEdge(e.w, e.v, label, forwardName);
      }
    });
  }
}
