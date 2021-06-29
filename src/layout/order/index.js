/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
import { Graph } from '../../graph/Graph.js';
import initOrder from "./init-order.js";
import crossCount from "./cross-count.js";
import sortSubgraph from "./sort-subgraph.js";
import buildLayerGraph from "./build-layer-graph.js";
import addSubgraphConstraints from "./add-subgraph-constraints.js";
import { maxRank, buildLayerMatrix, flatRange } from "../util.js";

/** @typedef {import('../../graph/types').NodeIdentifier} NodeIdentifier */
/** @typedef {import('../types').LayoutGraph} LayoutGraph */
/** @typedef {import('../types').LayoutEdge} LayoutEdge */
/** @typedef {import('../types').BorderedNode} BorderedNode */

/**
 * @param {Graph<LayoutGraph, BorderedNode, LayoutEdge>} g
 * @param {NodeIdentifier[][]} layering
 */
function assignOrder(g, layering) {
  layering.forEach((layer) => {
    layer.forEach((v, i) => {
      g.node(v).order = i;
    });
  });
}

/**
 * @param {Graph<LayoutGraph, BorderedNode, LayoutEdge>} g
 * @param {number[]} ranks
 * @param {'inEdges'|'outEdges'} relationship
 * @returns {Graph<LayoutGraph, BorderedNode, LayoutEdge>[]} 
 */
function buildLayerGraphs(g, ranks, relationship) {
  return ranks.map(rank => buildLayerGraph(g, rank, relationship));
}

/**
 * @param {Graph<LayoutGraph, BorderedNode, LayoutEdge>[]} layerGraphs
 * @param {boolean} biasRight
 */
function sweepLayerGraphs(layerGraphs, biasRight) {
  const cg = new Graph();
  layerGraphs.forEach((lg) => {
    const { root } = lg.graph();
    const sorted = sortSubgraph(lg, root, cg, biasRight);
    sorted.vs.forEach((v, i) => {
      lg.node(v).order = i;
    });
    addSubgraphConstraints(lg, cg, sorted.vs);
  });
}

/**
 * Applies heuristics to minimize edge crossings in the graph and sets the best
 * order solution as an order attribute on each node.
 *
 * Pre-conditions:
 *
 *    1. Graph must be DAG
 *    2. Graph nodes must be objects with a "rank" attribute
 *    3. Graph edges must have the "weight" attribute
 *
 * Post-conditions:
 *
 *    1. Graph nodes will have an "order" attribute based on the results of the
 *       algorithm.
 * 
 * @param {Graph<LayoutGraph, BorderedNode, LayoutEdge>} g
 */
export default function order(g) {
  const mr = maxRank(g);
  const downLayerGraphs = buildLayerGraphs(g, flatRange(1, mr + 1), "inEdges");
  const upLayerGraphs = buildLayerGraphs(g, flatRange(mr - 1, -1, -1), "outEdges");
  
  let layering = initOrder(g);
  assignOrder(g, layering);
  
  let bestCC = Number.POSITIVE_INFINITY;
  /** @type NodeIdentifier[][] */
  let best;

  for (let i = 0, lastBest = 0; lastBest < 4; ++i, ++lastBest) {
    sweepLayerGraphs(i % 2 ? downLayerGraphs : upLayerGraphs, i % 4 >= 2);
    layering = buildLayerMatrix(g);
    const cc = crossCount(g, layering);
    if (cc < bestCC) {
      lastBest = 0;
      best = layering.map(layer => [...layer]);
      bestCC = cc;
    }
  }
  assignOrder(g, best);
}
