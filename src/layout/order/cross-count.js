/* eslint-disable no-unused-vars */
/* eslint-disable no-bitwise */
/* eslint-disable no-plusplus */
import { Graph } from '../../graph/Graph.js';

/** @typedef {import('../../graph/types').NodeIdentifier} NodeIdentifier */
/** @typedef {import('../types').LayoutNode} LayoutNode */
/** @typedef {import('../types').LayoutGraph} LayoutGraph */
/** @typedef {import('../types').LayoutEdge} LayoutEdge */

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {NodeIdentifier[]} northLayer
 * @param {NodeIdentifier[]} southLayer
 * @returns {number} 
 */
function twoLayerCrossCount(g, northLayer, southLayer) {
  // Sort all of the edges between the north and south layers by their position
  // in the north layer and then the south. Map these edges to the position of
  // their head in the south layer.

  const southPos = {};
  southLayer.forEach((v, i) => {
    southPos[southLayer[i]] = i;
  });

  const southEntries = northLayer.map((v) => {
    const edges = g.outEdges(v);
    const mapped = (edges || []).map((e) => {
      const edge = g.edge(e);
      return { 
        pos: southPos[e.w], 
        weight: edge && edge.weight || 1,
      }
    });
    mapped.sort((a, b) => a.pos - b.pos);
    return mapped;
  }).flat();
  
  // Build the accumulator tree
  let firstIndex = 1;
  while (firstIndex < southLayer.length) {
    firstIndex <<= 1;
  }
  const treeSize = 2 * firstIndex - 1;
  firstIndex -= 1;
  const tree = new Array(treeSize).fill(0);

  // Calculate the weighted crossings
  let cc = 0;
  southEntries.forEach((entry) => {
    let index = entry.pos + firstIndex;
    tree[index] += entry.weight;
    let weightSum = 0;
    while (index > 0) {
      if (index % 2) {
        weightSum += tree[index + 1];
      }
      index = (index - 1) >> 1;
      tree[index] += entry.weight;
    }
    cc += entry.weight * weightSum;
  });

  return cc;
}

/**
 * A function that takes a layering (an array of layers, each with an array of
 * ordered nodes) and a graph and returns a weighted crossing count.
 *
 * Pre-conditions:
 *
 *    1. Input graph must be simple (not a multigraph), directed, and include
 *       only simple edges.
 *    2. Edges in the input graph must have assigned weights.
 *
 * Post-conditions:
 *
 *    1. The graph and layering matrix are left unchanged.
 *
 * This algorithm is derived from Barth, et al., "Bilayer Cross Counting."
 * 
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {NodeIdentifier[][]} layering
 * @returns {number}
 */
export default function crossCount(g, layering) {
  let cc = 0;
  for (let i = 1; i < layering.length; ++i) {
    cc += twoLayerCrossCount(g, layering[i-1], layering[i]);
  }
  return cc;
}
