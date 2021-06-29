/* eslint-disable no-unused-vars */
import { Graph } from '../../graph/Graph.js';
/** @typedef {import('../../graph/types').NodeIdentifier} NodeIdentifier */
/** @typedef {import('../types').BaryCenter} BaryCenter */
/** @typedef {import('../types').LayoutNode} LayoutNode */
/** @typedef {import('../types').LayoutGraph} LayoutGraph */
/** @typedef {import('../types').LayoutEdge} LayoutEdge */

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {NodeIdentifier[]} movable
 * @returns {BaryCenter[]}
 */
export default function barycenter(g, movable) {
  return (movable || []).map((v) => {
    const inV = g.inEdges(v);
    if (!inV.length) {
      return /** @type BaryCenter */ ({ v });
    }
    const result = inV.reduce((acc, e) => {
        const edge = g.edge(e);
        const nodeU = g.node(e.v);
        return {
          sum: acc.sum + edge.weight * nodeU.order,
          weight: acc.weight + edge.weight,
        };
      },
      { sum: 0, weight: 0 },
    );

    return /** @type BaryCenter */ ({
      v,
      barycenter: result.sum / result.weight,
      weight: result.weight,
    });
  });
}
