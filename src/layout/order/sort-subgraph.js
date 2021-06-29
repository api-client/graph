/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
import barycenter from "./barycenter.js";
import resolveConflicts from "./resolve-conflicts.js";
import sort from "./sort.js";
import { Graph } from '../../graph/Graph.js';

/** @typedef {import('../../graph/types').NodeIdentifier} NodeIdentifier */
/** @typedef {import('../types').SubgraphSortResult} SubgraphSortResult */
/** @typedef {import('../types').ConflictResolutionResult} ConflictResolutionResult */
/** @typedef {import('../types').BaryCenter} BaryCenter */
/** @typedef {import('../types').SortResult} SortResult */
/** @typedef {import('../types').LayoutNode} LayoutNode */
/** @typedef {import('../types').LayoutGraph} LayoutGraph */
/** @typedef {import('../types').LayoutEdge} LayoutEdge */
/** @typedef {import('../types').BorderedNode} BorderedNode */

/**
 * @param {ConflictResolutionResult[]} entries
 * @param {Record<NodeIdentifier, SubgraphSortResult>} subgraphs
 */
function expandSubgraphs(entries, subgraphs) {
  entries.forEach((entry) => {
    const mapped = entry.vs.map((v) => {
      if (subgraphs[v]) {
        return subgraphs[v].vs;
      }
      return v;
    });
    entry.vs = mapped.flat();
  });
}

/**
 * @param {BaryCenter} target
 * @param {SubgraphSortResult} other
 */
function mergeBarycenters(target, other) {
  if (typeof target.barycenter === 'number') {
    target.barycenter = (target.barycenter * target.weight + other.barycenter * other.weight) / (target.weight + other.weight);
    target.weight += other.weight;
  } else {
    target.barycenter = other.barycenter;
    target.weight = other.weight;
  }
}

/**
 * @param {Graph<LayoutGraph, BorderedNode, LayoutEdge>} g
 * @param {NodeIdentifier} v
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} cg
 * @param {boolean=} biasRight
 * @returns {SortResult} 
 */
export default function sortSubgraph(g, v, cg, biasRight=false) {
  let movable = g.children(v);
  const node = g.node(v);
  const bl = node ? /** @type NodeIdentifier */ (node.borderLeft) : undefined;
  const br = node ? /** @type NodeIdentifier */ (node.borderRight): undefined;
  /** @type Record<NodeIdentifier, SubgraphSortResult> */
  const subgraphs = {};

  if (bl) {
    movable = movable.filter(w => w !== bl && w !== br);
  }

  const barycenters = barycenter(g, movable);
  barycenters.forEach((entry) => {
    if (g.children(entry.v).length) {
      const subgraphResult = sortSubgraph(g, entry.v, cg, biasRight);
      subgraphs[entry.v] = subgraphResult;
      if (typeof subgraphResult.barycenter === 'number') {
        mergeBarycenters(entry, subgraphResult);
      }
    }
  });

  const entries = resolveConflicts(barycenters, cg);
  expandSubgraphs(entries, subgraphs);

  const result = sort(entries, biasRight);

  if (bl) {
    result.vs = [bl, result.vs, br].flat();
    if (g.predecessors(bl).length) {
      const blPred = g.node(g.predecessors(bl)[0]);
      const brPred = g.node(g.predecessors(br)[0]);
      if (typeof result.barycenter !== 'number') {
        result.barycenter = 0;
        result.weight = 0;
      }
      result.barycenter = (result.barycenter * result.weight + blPred.order + brPred.order) / (result.weight + 2);
      result.weight += 2;
    }
  }

  return result;
}
