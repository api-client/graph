/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
import { Graph } from '../../graph/Graph.js';

/** @typedef {import('../../graph/types').NodeIdentifier} NodeIdentifier */
/** @typedef {import('../types').BaryCenter} BaryCenter */
/** @typedef {import('../types').ConflictResolution} ConflictResolution */
/** @typedef {import('../types').ConflictResolutionResult} ConflictResolutionResult */
/** @typedef {import('../types').LayoutNode} LayoutNode */
/** @typedef {import('../types').LayoutGraph} LayoutGraph */
/** @typedef {import('../types').LayoutEdge} LayoutEdge */

/**
 * @param {ConflictResolution} target
 * @param {ConflictResolution} source
 */
function mergeEntries(target, source) {
  let sum = 0;
  let weight = 0;

  if (target.weight) {
    sum += target.barycenter * target.weight;
    weight += target.weight;
  }

  if (source.weight) {
    sum += source.barycenter * source.weight;
    weight += source.weight;
  }

  target.vs = source.vs.concat(target.vs);
  target.barycenter = sum / weight;
  target.weight = weight;
  target.i = Math.min(source.i, target.i);
  source.merged = true;
}

/**
 * @param {ConflictResolution[]} sourceSet
 * @returns {ConflictResolutionResult[]} 
 */
function doResolveConflicts(sourceSet) {
  const entries = /** @type ConflictResolution[] */ ([]);

  /**
   * @param {ConflictResolution} vEntry
   * @returns {(uEntry: ConflictResolution) => void} 
   */
  function handleIn(vEntry) {
    return (uEntry) => {
      if (uEntry.merged) {
        return;
      }
      if (typeof uEntry.barycenter === 'undefined' || typeof vEntry.barycenter === 'undefined' || uEntry.barycenter >= vEntry.barycenter) {
        mergeEntries(vEntry, uEntry);
      }
    };
  }

  /**
   * @param {ConflictResolution} vEntry
   * @returns {(wEntry: ConflictResolution) => void} 
   */
  function handleOut(vEntry) {
    return (wEntry) => {
      wEntry.in.push(vEntry);
      if (--wEntry.inDegree === 0) {
        sourceSet.push(wEntry);
      }
    };
  }

  while (sourceSet.length) {
    const entry = sourceSet.pop();
    entries.push(entry);
    entry.in.reverse().forEach(handleIn(entry));
    entry.out.forEach(handleOut(entry));
  }

  const filtered = entries.filter(entry => !entry.merged);
  return filtered.map((entry) => {
    const item = /** @type ConflictResolutionResult */ ({
      vs: entry.vs,
      i: entry.i,
    });
    if (typeof entry.barycenter === 'number') {
      item.barycenter = entry.barycenter;
      item.weight = entry.weight;
    }
    return item;
  });
}



/**
 * Given a list of entries of the form {v, barycenter, weight} and a
 * constraint graph this function will resolve any conflicts between the
 * constraint graph and the barycenters for the entries. If the barycenters for
 * an entry would violate a constraint in the constraint graph then we coalesce
 * the nodes in the conflict into a new node that respects the constraint and
 * aggregates barycenter and weight information.
 *
 * This implementation is based on the description in Forster, "A Fast and
 * Simple Heuristic for Constrained Two-Level Crossing Reduction," thought it
 * differs in some specific details.
 *
 * Pre-conditions:
 *
 *    1. Each entry has the form {v, barycenter, weight}, or if the node has
 *       no barycenter, then {v}.
 *
 * Returns:
 *
 *    A new list of entries of the form {vs, i, barycenter, weight}. The list
 *    `vs` may either be a singleton or it may be an aggregation of nodes
 *    ordered such that they do not violate constraints from the constraint
 *    graph. The property `i` is the lowest original index of any of the
 *    elements in `vs`.
 * 
 * @param {BaryCenter[]} entries
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} cg
 * @returns {ConflictResolutionResult[]}
 */
export default function resolveConflicts(entries, cg) {
  /** @type Record<NodeIdentifier, ConflictResolution> */
  const mappedEntries = {};
  entries.forEach((entry, i) => {
    const tmp = /** @type ConflictResolution */ ({
      inDegree: 0,
      "in": [],
      out: [],
      vs: [entry.v],
      i
    });
    mappedEntries[entry.v] = tmp;
    if (typeof entry.barycenter === 'number') {
      tmp.barycenter = entry.barycenter;
      tmp.weight = entry.weight;
    }
  });

  (cg.edges() || []).forEach((e) => {
    const entryV = mappedEntries[e.v];
    const entryW = mappedEntries[e.w];
    if (entryV && entryW) {
      entryW.inDegree++;
      entryV.out.push(mappedEntries[e.w]);
    }
  });

  const sourceSet = Object.values(mappedEntries).filter(entry => !entry.inDegree);

  return doResolveConflicts(sourceSet);
}
