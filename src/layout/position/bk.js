/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
import { Graph } from '../../graph/Graph.js';
import { buildLayerMatrix, flatRange } from '../util.js';

/** @typedef {import('../../graph/types').NodeIdentifier} NodeIdentifier */
/** @typedef {import('../types').LayoutNode} LayoutNode */
/** @typedef {import('../types').LayoutGraph} LayoutGraph */
/** @typedef {import('../types').LayoutEdge} LayoutEdge */

/*
 * This module provides coordinate assignment based on Brandes and Köpf, "Fast
 * and Simple Horizontal Coordinate Assignment."
 */

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {NodeIdentifier} v
 * @returns {NodeIdentifier|undefined} 
 */
function findOtherInnerSegmentNode(g, v) {
  if (g.node(v).dummy) {
    return (g.predecessors(v) || []).find(u => g.node(u).dummy);
  }
  return undefined;
}

/**
 * @param {Record<NodeIdentifier, Record<NodeIdentifier, boolean>>} conflicts
 * @param {NodeIdentifier} v
 * @param {NodeIdentifier} w
 */
export function addConflict(conflicts, v, w) {
  if (v > w) {
    const tmp = v;
    v = w;
    w = tmp;
  }

  let conflictsV = conflicts[v];
  if (!conflictsV) {
    conflictsV = {};
    conflicts[v] = conflictsV;
  }
  conflictsV[w] = true;
}

/**
 * @param {Record<NodeIdentifier, Record<NodeIdentifier, boolean>>} conflicts
 * @param {NodeIdentifier} v
 * @param {NodeIdentifier} w
 */
export function hasConflict(conflicts, v, w) {
  if (v > w) {
    const tmp = v;
    v = w;
    w = tmp;
  }
  return !!conflicts[v] && !!conflicts[v][w];
}

/**
 * Marks all edges in the graph with a type-1 conflict with the "type1Conflict"
 * property. A type-1 conflict is one where a non-inner segment crosses an
 * inner segment. An inner segment is an edge with both incident nodes marked
 * with the "dummy" property.
 *
 * This algorithm scans layer by layer, starting with the second, for type-1
 * conflicts between the current layer and the previous layer. For each layer
 * it scans the nodes from left to right until it reaches one that is incident
 * on an inner segment. It then scans predecessors to determine if they have
 * edges that cross that inner segment. At the end a final scan is done for all
 * nodes on the current rank to see if they cross the last visited inner
 * segment.
 *
 * This algorithm (safely) assumes that a dummy node will only be incident on a
 * single node in the layers being scanned.
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {NodeIdentifier[][]} layering
 * @returns {Record<NodeIdentifier, Record<NodeIdentifier, boolean>>} 
 */
export function findType1Conflicts(g, layering) {
  /** @type {Record<NodeIdentifier, Record<NodeIdentifier, boolean>>} */
  const conflicts = {};

  /**
   * @param {NodeIdentifier[]} prevLayer
   * @param {NodeIdentifier[]} layer
   * @returns {NodeIdentifier[]} 
   */
  function visitLayer(prevLayer, layer) {
    let
      // last visited node in the previous layer that is incident on an inner
      // segment.
      k0 = 0;
      // Tracks the last node in this layer scanned for crossings with a type-1
      // segment.
      let scanPos = 0;
      const prevLayerLength = prevLayer.length;
      const lastNode = layer[layer.length - 1];

      layer.forEach((v, i) => {
      const w = findOtherInnerSegmentNode(g, v);
      const k1 = w ? g.node(w).order : prevLayerLength;

      if (w || v === lastNode) {
        layer.slice(scanPos, i + 1).forEach((scanNode) => {
          (g.predecessors(scanNode) || []).forEach((u) => {
            const uLabel = g.node(u);
            const uPos = uLabel.order;
            if ((uPos < k0 || k1 < uPos) && !(uLabel.dummy && g.node(scanNode).dummy)) {
              addConflict(conflicts, u, scanNode);
            }
          });
        });
        scanPos = i + 1;
        k0 = k1;
      }
    });

    return layer;
  }

  (layering || []).reduce(visitLayer);
  return conflicts;
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {NodeIdentifier[][]} layering
 * @returns {Record<NodeIdentifier, Record<NodeIdentifier, boolean>>} 
 */
export function findType2Conflicts(g, layering) {
  /** @type Record<NodeIdentifier, Record<NodeIdentifier, boolean>> */
  const conflicts = {};

  /**
   * @param {NodeIdentifier[]} south
   * @param {number} southPos
   * @param {number} southEnd
   * @param {number} prevNorthBorder
   * @param {number} nextNorthBorder
   */
  function scan(south, southPos, southEnd, prevNorthBorder, nextNorthBorder) {
    const range = flatRange(southPos, southEnd);
    let v;
    range.forEach((i) => {
      v = south[i];
      if (g.node(v).dummy) {
        (g.predecessors(v) || []).forEach((u) => {
          const uNode = g.node(u);
          if (uNode.dummy && (uNode.order < prevNorthBorder || uNode.order > nextNorthBorder)) {
            addConflict(conflicts, u, v);
          }
        });
      }
    });
  }

  /**
   * @param {NodeIdentifier[]} north
   * @param {NodeIdentifier[]} south
   * @return {NodeIdentifier[]} 
   */
  function visitLayer(north, south) {
    let prevNorthPos = -1;
    let nextNorthPos;
    let southPos = 0;

    south.forEach((v, southLookahead) => {
      if (g.node(v).dummy === "border") {
        const predecessors = g.predecessors(v);
        if (predecessors.length) {
          nextNorthPos = g.node(predecessors[0]).order;
          scan(south, southPos, southLookahead, prevNorthPos, nextNorthPos);
          southPos = southLookahead;
          prevNorthPos = nextNorthPos;
        }
      }
      scan(south, southPos, south.length, nextNorthPos, north.length);
    });
    return south;
  }

  (layering || []).reduce(visitLayer);
  return conflicts;
}

/**
 * Try to align nodes into vertical "blocks" where possible. This algorithm
 * attempts to align a node with one of its median neighbors. If the edge
 * connecting a neighbor is a type-1 conflict then we ignore that possibility.
 * If a previous node has already formed a block with a node after the node
 * we're trying to form a block with, we also ignore that possibility - our
 * blocks would be split in that scenario.
 * 
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {NodeIdentifier[][]} layering
 * @param {Record<NodeIdentifier, Record<NodeIdentifier, boolean>>} conflicts
 * @param {(v: NodeIdentifier) => NodeIdentifier[]} neighborFn
 * @returns {{root: Record<NodeIdentifier, NodeIdentifier>, align: Record<NodeIdentifier, NodeIdentifier>}}
 */
export function verticalAlignment(g, layering, conflicts, neighborFn) {
  /** @type {Record<NodeIdentifier, NodeIdentifier>} */
  const root = {};
  /** @type {Record<NodeIdentifier, NodeIdentifier>} */
  const align = {};
  /** @type {Record<NodeIdentifier, number>} */
  const pos = {};

  // We cache the position here based on the layering because the graph and
  // layering may be out of sync. The layering matrix is manipulated to
  // generate different extreme alignments.
  (layering || []).forEach((layer) => {
    if (!layer) {
      return;
    }
    layer.forEach((v, order) => {
      root[v] = v;
      align[v] = v;
      pos[v] = order;
    });
  });

  (layering || []).forEach((layer) => {
    let prevIdx = -1;
    for (const v of Object.values(layer)) {
      const ws = neighborFn(v);
      if (ws) {
        // ws = _.sortBy(ws, w => pos[w]);
        ws.sort((a, b) => {
          const aPos = pos[a];
          const bPos = pos[b];
          return aPos - bPos;
        });
        const mp = (ws.length - 1) / 2;
        for (let i = Math.floor(mp), il = Math.ceil(mp); i <= il; ++i) {
          const w = ws[i];
          if (align[v] === v && prevIdx < pos[w] && !hasConflict(conflicts, v, w)) {
            align[w] = v;
            align[v] = root[w];
            root[v] = root[w];
            prevIdx = pos[w];
          }
        }
      }
    }
  });

  return { root, align };
}

/**
 * @param {number} nodeSeparation
 * @param {number} edgeSeparation
 * @param {boolean} reverseSep
 * @returns {(g: Graph, v: NodeIdentifier, w: NodeIdentifier) => number} 
 */
function sep(nodeSeparation, edgeSeparation, reverseSep) {
  return (g, v, w) => {
    const vLabel = g.node(v);
    const wLabel = g.node(w);
    let sum = 0;
    let delta;
    
    sum += vLabel.width / 2;
    if (typeof vLabel.labelPos === 'string') {
      switch (vLabel.labelPos.toLowerCase()) {
        case "l": delta = -vLabel.width / 2; break;
        case "r": delta = vLabel.width / 2; break;
        default:
      }
    }
    if (delta) {
      sum += reverseSep ? delta : -delta;
    }
    delta = 0;
    sum += (vLabel.dummy ? edgeSeparation : nodeSeparation) / 2;
    sum += (wLabel.dummy ? edgeSeparation : nodeSeparation) / 2;
    
    sum += wLabel.width / 2;
    if (typeof wLabel.labelPos === 'string') {
      switch (wLabel.labelPos.toLowerCase()) {
        case "l": delta = wLabel.width / 2; break;
        case "r": delta = -wLabel.width / 2; break;
        default:
      }
    }
    if (delta) {
      sum += reverseSep ? delta : -delta;
    }
    delta = 0;
    return sum;
  };
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {NodeIdentifier[][]} layering
 * @param {Record<NodeIdentifier, NodeIdentifier>} root
 * @param {boolean} reverseSep
 * @returns {Graph} 
 */
function buildBlockGraph(g, layering, root, reverseSep) {
  const blockGraph = new Graph();
  const graphLabel = g.graph();
  const sepFn = sep(graphLabel.nodeSeparation, graphLabel.edgeSeparation, reverseSep);

  (layering || []).forEach((layer) => {
    let u;
    (layer || []).forEach((v) => {
      const vRoot = root[v];
      blockGraph.setNode(vRoot);
      if (u) {
        const uRoot = root[u];
        const prevMax = blockGraph.edge(uRoot, vRoot);
        blockGraph.setEdge(uRoot, vRoot, Math.max(sepFn(g, v, u), prevMax || 0));
      }
      u = v;
    });
  });

  return blockGraph;
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {NodeIdentifier[][]} layering
 * @param {Record<NodeIdentifier, NodeIdentifier>} root
 * @param {Record<NodeIdentifier, NodeIdentifier>} align
 * @param {boolean=} reverseSep
 * @returns {Record<NodeIdentifier, number>} 
 */
export function horizontalCompaction(g, layering, root, align, reverseSep=false) {
  // This portion of the algorithm differs from BK due to a number of problems.
  // Instead of their algorithm we construct a new block graph and do two
  // sweeps. The first sweep places blocks with the smallest possible
  // coordinates. The second sweep removes unused space by moving blocks to the
  // greatest coordinates without violating separation.

  /** @type Record<NodeIdentifier, number> */ 
  const xs = {};
  const blockG = buildBlockGraph(g, layering, root, reverseSep);
  const borderType = reverseSep ? "borderLeft" : "borderRight";
  
  /**
   * @param {(elm: NodeIdentifier) => void} setXsFunc
   * @param {(v: NodeIdentifier) => NodeIdentifier[]} nextNodesFunc
   */
  function iterate(setXsFunc, nextNodesFunc) {
    let stack = blockG.nodes();
    let elem = stack.pop();
    const visited = {};
    while (elem) {
      if (visited[elem]) {
        setXsFunc(elem);
      } else {
        visited[elem] = true;
        stack.push(elem);
        stack = stack.concat(nextNodesFunc(elem));
      }

      elem = stack.pop();
    }
  }

  /**
   * First pass, assign smallest coordinates
   * @param {NodeIdentifier} elem
   */
  function pass1(elem) {
    xs[elem] = blockG.inEdges(elem).reduce((acc, e) => Math.max(acc, xs[e.v] + (blockG.edge(e) || Number.NaN)), 0);
  }

  /**
   * Second pass, assign greatest coordinates
   * @param {NodeIdentifier} elem
   */
  function pass2(elem) {
    const min = blockG.outEdges(elem).reduce((acc, e) => Math.min(acc, xs[e.w] - blockG.edge(e)), Number.POSITIVE_INFINITY);

    const node = g.node(elem);
    if (min !== Number.POSITIVE_INFINITY && node.borderType !== borderType) {
      xs[elem] = Math.max(xs[elem], min);
    }
  }
  iterate(pass1, blockG.predecessors.bind(blockG));
  iterate(pass2, blockG.successors.bind(blockG));
  
  // Assign x coordinates to all nodes
  Object.values(align).forEach((v) => {
    xs[v] = xs[root[v]];
  });

  return xs;
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {NodeIdentifier} v
 * @returns {number} 
 */
function width(g, v) {
  return g.node(v).width;
}

/**
 * Returns the alignment that has the smallest width of the given alignments.
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @param {Record<string, Record<NodeIdentifier, number>>} xss
 * @returns {Record<NodeIdentifier, number>}
 */
export function findSmallestWidthAlignment(g, xss) {
  const values = Object.values(xss);
  let minValue = Number.POSITIVE_INFINITY;
  /** @type Record<NodeIdentifier, number> */
  let minObject;

  values.forEach((xs) => {
    let max = Number.NEGATIVE_INFINITY;
    let min = Number.POSITIVE_INFINITY;

    Object.entries(xs).forEach(([v, x]) => {
      const halfWidth = width(g, v) / 2;
      max = Math.max(x + halfWidth, max);
      min = Math.min(x - halfWidth, min);
    });
    const d = max - min;
    if (d < minValue) {
      minValue = d;
      minObject = xs;
    }
  });
  return minObject;
  // return _.minBy(values, (xs) => {
  //   let max = Number.NEGATIVE_INFINITY;
  //   let min = Number.POSITIVE_INFINITY;

  //   _.forIn(xs, (x, v) => {
  //     const halfWidth = width(g, v) / 2;

  //     max = Math.max(x + halfWidth, max);
  //     min = Math.min(x - halfWidth, min);
  //   });

  //   return max - min;
  // });
}

/**
 * Align the coordinates of each of the layout alignments such that
 * left-biased alignments have their minimum coordinate at the same point as
 * the minimum coordinate of the smallest width alignment and right-biased
 * alignments have their maximum coordinate at the same point as the maximum
 * coordinate of the smallest width alignment.
 * @param {Record<string, Record<NodeIdentifier, number>>} xss
 * @param {Record<NodeIdentifier, number>} alignTo
 */
export function alignCoordinates(xss, alignTo) {
  const alignToValues = alignTo ? Object.values(alignTo) : [];
  const alignToMin = Math.min(...alignToValues);
  const alignToMax = Math.max(...alignToValues);

  ["u", "d"].forEach((vert) => {
    ["l", "r"].forEach((horizontal) => {
      const alignment = vert + horizontal;
      const xs = xss[alignment];
      if (xs === alignTo) {
        return;
      }

      const xsValues = Object.values(xs);
      const delta = horizontal === "l" ? alignToMin - Math.min(...xsValues) : alignToMax - Math.max(...xsValues);

      if (delta) {
        const updated = /** @type Record<NodeIdentifier, number> */ ({});
        Object.keys(xs).forEach((key) => {
          const val = xs[key]
          updated[key] = val + delta;
        });
        xss[alignment] = updated; // .mapValues(xs, x => x + delta);
      }
    });
  });
}

/**
 * @param {Record<string, Record<NodeIdentifier, number>>} xss
 * @param {string=} align
 * @returns {Record<NodeIdentifier, number>} 
 */
export function balance(xss, align) {
  const result = /** @type Record<NodeIdentifier, number> */ ({});
  Object.keys(xss.ul).forEach((v) => {
    if (align) {
      result[v] = xss[align.toLowerCase()][v];
    } else {
      const xs = Object.values(xss).map(item => item[v]).sort((a, b) => a - b);
      result[v] = (xs[1] + xs[2]) / 2;
    }
  });
  return result;
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 * @returns {Record<NodeIdentifier, number>} 
 */
export function positionX(g) {
  const layering = buildLayerMatrix(g);
  const conflicts = {
    ...findType1Conflicts(g, layering),
    ...findType2Conflicts(g, layering),
  };

  /** @type Record<string, Record<NodeIdentifier, number>> */
  const xss = {};
  /** @type NodeIdentifier[][] */
  let adjustedLayering;
  ["u", "d"].forEach((vert) => {
    adjustedLayering = vert === "u" ? layering : Object.values(layering).reverse();
    ["l", "r"].forEach((horizontal) => {
      if (horizontal === "r") {
        adjustedLayering = adjustedLayering.map(inner => Object.values(inner).reverse());
      }

      /** @type {(v: NodeIdentifier) => NodeIdentifier[]} */
      const neighborFn = (vert === "u" ? g.predecessors : g.successors).bind(g);
      const align = verticalAlignment(g, adjustedLayering, conflicts, neighborFn);
      const xs = horizontalCompaction(g, adjustedLayering, align.root, align.align, horizontal === "r");
      if (horizontal === "r") {
        Object.keys(xs).forEach((key) => {
          xs[key] = -xs[key];
        });
      }
      xss[vert + horizontal] = xs;
    });
  });

  const smallestWidth = findSmallestWidthAlignment(g, xss);
  alignCoordinates(xss, smallestWidth);
  return balance(xss, g.graph().align);
}
