/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
import { Graph } from '../graph/Graph.js';
import * as acyclic from "./acyclic.js";
import * as normalize from "./normalize.js";
import rank from "./rank/index.js";
import { normalizeRanks, removeEmptyRanks, asNonCompoundGraph, addDummyNode, intersectRect, buildLayerMatrix, time } from "./util.js";
import parentDummyChains from "./parent-dummy-chains.js";
import * as nestingGraph from "./nesting-graph.js";
import addBorderSegments from "./add-border-segments.js";
import * as coordinateSystem from "./coordinate-system.js";
import order from "./order/index.js";
import position from "./position/index.js";

/** @typedef {import('./types').LayoutOptions} LayoutOptions */
/** @typedef {import('./types').EdgeConfig} EdgeConfig */
/** @typedef {import('./types').NodeConfig} NodeConfig */
/** @typedef {import('./types').GraphLabel} GraphLabel */
/** @typedef {import('./types').BorderedNode} BorderedNode */
/** @typedef {import('./types').SelfEdgedNode} SelfEdgedNode */
/** @typedef {import('./types').LayoutNode} LayoutNode */
/** @typedef {import('./types').LayoutEdge} LayoutEdge */
/** @typedef {import('./types').LayoutGraph} LayoutGraph */
/** @typedef {import('../graph/types').NodeIdentifier} NodeIdentifier */

/**
 * This idea comes from the Gansner paper: to account for edge labels in our
 * layout we split each rank in half by doubling minLen and halving rankSeparation.
 * Then we can place labels at these mid-points between nodes.
 *
 * We also add some minimal padding to the width to push the label for the edge
 * away from the edge itself a bit.
 * 
 * @param {Graph<GraphLabel, NodeConfig, EdgeConfig>} g
 */
function makeSpaceForEdgeLabels(g) {
  const graph = g.graph();
  graph.rankSeparation /= 2;
  (g.edges() || []).forEach((e) => {
    const edge = g.edge(e);
    edge.minLen *= 2;
    if (String(edge.labelPos).toLowerCase() !== "c") {
      if (graph.rankDir === "TB" || graph.rankDir === "BT") {
        edge.width += edge.labelOffset;
      } else {
        edge.height += edge.labelOffset;
      }
    }
  });
}

/**
 * @param {Graph<GraphLabel, SelfEdgedNode, EdgeConfig>} g
 */
function removeSelfEdges(g) {
  (g.edges() || []).forEach((e) => {
    if (e.v === e.w) {
      const node = g.node(e.v);
      if (!node.selfEdges) {
        node.selfEdges = [];
      }
      node.selfEdges.push({ e, label: g.edge(e) });
      g.removeEdge(e);
    }
  });
}

/**
 * Creates temporary dummy nodes that capture the rank in which each edge's
 * label is going to, if it has one of non-zero width and height. We do this
 * so that we can safely remove empty ranks while preserving balance for the
 * label's position.
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 */
function injectEdgeLabelProxies(g) {
  (g.edges() || []).forEach((e) => {
    const edge = g.edge(e);
    if (edge.width && edge.height) {
      const v = g.node(e.v);
      const w = g.node(e.w);
      const label = { rank: (w.rank - v.rank) / 2 + v.rank, e };
      addDummyNode(g, "edge-proxy", label, "_ep");
    }
  });
}

/**
 * @param {Graph<LayoutGraph, BorderedNode, LayoutEdge>} g
 */
function assignRankMinMax(g) {
  let maxRank = 0;
  (g.nodes() || []).forEach((v) => {
    const node = g.node(v);
    if (node.borderTop) {
      node.minRank = g.node(node.borderTop).rank || 0;
      node.maxRank = g.node(node.borderBottom).rank || 0;
      maxRank = Math.max(maxRank, node.maxRank);
    }
  });
  g.graph().maxRank = maxRank;
}

/**
 * @param {Graph<LayoutGraph, SelfEdgedNode, LayoutEdge>} g
 */
function removeEdgeLabelProxies(g) {
  (g.nodes() || []).forEach((v) => {
    const node = g.node(v);
    if (node.dummy === "edge-proxy") {
      g.edge(node.e).labelRank = node.rank;
      g.removeNode(v);
    }
  });
}

/**
 * @param {Graph<LayoutGraph, SelfEdgedNode, LayoutEdge>} g
 */
function insertSelfEdges(g) {
  const layers = buildLayerMatrix(g);
  layers.forEach((layer) => {
    let orderShift = 0;
    layer.forEach((v, i) => {
      const node = g.node(v);
      node.order = i + orderShift;
      (node.selfEdges || []).forEach((selfEdge) => {
        addDummyNode(g, "selfEdge", {
          width: selfEdge.label.width,
          height: selfEdge.label.height,
          rank: node.rank,
          order: i + (++orderShift),
          e: selfEdge.e,
          label: selfEdge.label,
        }, "_se");
      });
      delete node.selfEdges;
    });
  });
}

/**
 * @param {Graph<LayoutGraph, SelfEdgedNode, LayoutEdge>} g
 */
function positionSelfEdges(g) {
  (g.nodes() || []).forEach((v) => {
    const node = g.node(v);
    if (node.dummy === "selfEdge") {
      const selfNode = g.node(node.e.v);
      const x = selfNode.x + selfNode.width / 2;
      const {y} = selfNode;
      const dx = node.x - x;
      const dy = selfNode.height / 2;
      g.setEdge(node.e, node.label);
      g.removeNode(v);
      node.label.points = [
        { x: x + 2 * dx / 3, y: y - dy },
        { x: x + 5 * dx / 6, y: y - dy },
        { x: x +     dx    , y },
        { x: x + 5 * dx / 6, y: y + dy },
        { x: x + 2 * dx / 3, y: y + dy }
      ];
      node.label.x = node.x;
      node.label.y = node.y;
    }
  });
}

/**
 * @param {Graph<LayoutGraph, BorderedNode, LayoutEdge>} g
 */
function removeBorderNodes(g) {
  (g.nodes() || []).forEach((v) => {
    const children = g.children(v);
    if (children && children.length) {
      const node = g.node(v);
      const bl = /** @type NodeIdentifier[] */ (node.borderLeft);
      const br = /** @type NodeIdentifier[] */ (node.borderRight);
      const t = g.node(node.borderTop);
      const b = g.node(node.borderBottom);
      const l = g.node(bl[bl.length - 1]);
      const r = g.node(br[br.length - 1]);
      node.width = Math.abs(r.x - l.x);
      node.height = Math.abs(b.y - t.y);
      node.x = l.x + node.width / 2;
      node.y = t.y + node.height / 2;
    }
  });

  (g.nodes() || []).forEach((v) => {
    if (g.node(v).dummy === "border") {
      g.removeNode(v);
    }
  });
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 */
function fixupEdgeLabelCoords(g) {
  (g.edges() || []).forEach((e) => {
    const edge = g.edge(e);
    if (typeof edge.x  === 'number') {
      if (String(edge.labelPos) === "l" || String(edge.labelPos) === "r") {
        edge.width -= edge.labelOffset;
      }
      switch (String(edge.labelPos)) {
        case "l": edge.x -= edge.width / 2 + edge.labelOffset; break;
        case "r": edge.x += edge.width / 2 + edge.labelOffset; break;
        default:
      }
    }
  });
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 */
function translateGraph(g) {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = 0;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = 0;
  const graphLabel = g.graph();
  const marginX = graphLabel.marginX || 0;
  const marginY = graphLabel.marginY || 0;

  /**
   * @param {EdgeConfig} attrs 
   */
  function getExtremes(attrs) {
    const {x, y} = attrs;
    const w = attrs.width;
    const h = attrs.height;
    minX = Math.min(minX, x - w / 2);
    maxX = Math.max(maxX, x + w / 2);
    minY = Math.min(minY, y - h / 2);
    maxY = Math.max(maxY, y + h / 2);
  }

  (g.nodes() || []).forEach((v) => { getExtremes(g.node(v)); });
  (g.edges() || []).forEach((e) => {
    const edge = g.edge(e);
    if (typeof edge.x === 'number') {
      getExtremes(edge);
    }
  });

  minX -= marginX;
  minY -= marginY;

  (g.nodes() || []).forEach((v) => {
    const node = g.node(v);
    node.x -= minX;
    node.y -= minY;
  });

  (g.edges() || []).forEach((e) => {
    const edge = g.edge(e);
    (edge.points || []).forEach((p) => {
      p.x -= minX;
      p.y -= minY;
    });
    if (typeof edge.x === 'number') { edge.x -= minX; }
    if (typeof edge.y === 'number') { edge.y -= minY; }
  });

  graphLabel.width = maxX - minX + marginX;
  graphLabel.height = maxY - minY + marginY;
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 */
function assignNodeIntersects(g) {
  (g.edges() || []).forEach((e) => {
    const edge = g.edge(e);
    const nodeV = g.node(e.v);
    const nodeW = g.node(e.w);
    let p1; 
    let p2;
    if (!edge.points) {
      edge.points = [];
      p1 = nodeW;
      p2 = nodeV;
    } else {
      [p1] = edge.points;
      p2 = edge.points[edge.points.length - 1];
    }
    edge.points.unshift(intersectRect(nodeV, p1));
    edge.points.push(intersectRect(nodeW, p2));
  });
}

/**
 * @param {Graph<LayoutGraph, LayoutNode, LayoutEdge>} g
 */
function reversePointsForReversedEdges(g) {
  (g.edges() || []).forEach((e) => {
    const edge = g.edge(e);
    if (edge.reversed) {
      edge.points.reverse();
    }
  });
}

/**
 * @param {Graph<GraphLabel, NodeConfig, EdgeConfig>} g
 * @param {Function} timeFn
 */
function runLayoutTime(g, timeFn) {
  const layoutGraph = /** @type Graph<LayoutGraph, LayoutNode, LayoutEdge> */ (g);
  timeFn("    makeSpaceForEdgeLabels", () => { makeSpaceForEdgeLabels(g); });
  timeFn("    removeSelfEdges",        () => { removeSelfEdges(/** @type Graph<LayoutGraph, SelfEdgedNode, LayoutEdge> */ (g)); });
  timeFn("    acyclic",                () => { acyclic.run(layoutGraph); });
  timeFn("    nestingGraph.run",       () => { nestingGraph.run(layoutGraph); });
  timeFn("    rank",                   () => { rank(asNonCompoundGraph(layoutGraph)); });
  timeFn("    injectEdgeLabelProxies", () => { injectEdgeLabelProxies(layoutGraph); });
  timeFn("    removeEmptyRanks",       () => { removeEmptyRanks(layoutGraph); });
  timeFn("    nestingGraph.cleanup",   () => { nestingGraph.cleanup(layoutGraph); });
  timeFn("    normalizeRanks",         () => { normalizeRanks(layoutGraph); });
  timeFn("    assignRankMinMax",       () => { assignRankMinMax(/** @type Graph<LayoutGraph, BorderedNode, LayoutEdge> */ (g)); });
  timeFn("    removeEdgeLabelProxies", () => { removeEdgeLabelProxies(/** @type Graph<LayoutGraph, SelfEdgedNode, LayoutEdge> */(g)); });
  timeFn("    normalize.run",          () => { normalize.run(layoutGraph); });
  timeFn("    parentDummyChains",      () => { parentDummyChains(layoutGraph); });
  timeFn("    addBorderSegments",      () => { addBorderSegments(/** @type Graph<LayoutGraph, BorderedNode, LayoutEdge> */ (g)); });
  timeFn("    order",                  () => { order(/** @type Graph<LayoutGraph, BorderedNode, LayoutEdge> */ (g)); });
  timeFn("    insertSelfEdges",        () => { insertSelfEdges(/** @type Graph<LayoutGraph, SelfEdgedNode, LayoutEdge> */ (g)); });
  timeFn("    adjustCoordinateSystem", () => { coordinateSystem.adjust(g); });
  timeFn("    position",               () => { position(g); });
  timeFn("    positionSelfEdges",      () => { positionSelfEdges(/** @type Graph<LayoutGraph, SelfEdgedNode, LayoutEdge> */ (g)); });
  timeFn("    removeBorderNodes",      () => { removeBorderNodes(/** @type Graph<LayoutGraph, BorderedNode, LayoutEdge> */ (g)); });
  timeFn("    normalize.undo",         () => { normalize.undo(/** @type Graph<LayoutGraph, SelfEdgedNode, LayoutEdge> */ (g)); });
  timeFn("    fixupEdgeLabelCoords",   () => { fixupEdgeLabelCoords(layoutGraph); });
  timeFn("    undoCoordinateSystem",   () => { coordinateSystem.undo(g); });
  timeFn("    translateGraph",         () => { translateGraph(layoutGraph); });
  timeFn("    assignNodeIntersects",   () => { assignNodeIntersects(layoutGraph); });
  timeFn("    reversePoints",          () => { reversePointsForReversedEdges(layoutGraph); });
  timeFn("    acyclic.undo",           () => { acyclic.undo(layoutGraph); });
}
/**
 * @param {Graph<GraphLabel, NodeConfig, EdgeConfig>} g
 */
function runLayout(g) {
  const layoutGraph = /** @type Graph<LayoutGraph, LayoutNode, LayoutEdge> */ (g);
  makeSpaceForEdgeLabels(g);
  removeSelfEdges(/** @type Graph<LayoutGraph, SelfEdgedNode, LayoutEdge> */ (g));
  acyclic.run(layoutGraph);
  nestingGraph.run(layoutGraph);
  rank(asNonCompoundGraph(layoutGraph));
  injectEdgeLabelProxies(layoutGraph);
  removeEmptyRanks(layoutGraph);
  nestingGraph.cleanup(layoutGraph);
  normalizeRanks(layoutGraph);
  assignRankMinMax(/** @type Graph<LayoutGraph, BorderedNode, LayoutEdge> */ (g));
  removeEdgeLabelProxies(/** @type Graph<LayoutGraph, SelfEdgedNode, LayoutEdge> */(g));
  normalize.run(layoutGraph);
  parentDummyChains(layoutGraph);
  addBorderSegments(/** @type Graph<LayoutGraph, BorderedNode, LayoutEdge> */ (g));
  order(/** @type Graph<LayoutGraph, BorderedNode, LayoutEdge> */ (g));
  insertSelfEdges(/** @type Graph<LayoutGraph, SelfEdgedNode, LayoutEdge> */ (g));
  coordinateSystem.adjust(g);
  position(g);
  positionSelfEdges(/** @type Graph<LayoutGraph, SelfEdgedNode, LayoutEdge> */ (g));
  removeBorderNodes(/** @type Graph<LayoutGraph, BorderedNode, LayoutEdge> */ (g));
  normalize.undo(/** @type Graph<LayoutGraph, SelfEdgedNode, LayoutEdge> */ (g));
  fixupEdgeLabelCoords(layoutGraph);
  coordinateSystem.undo(g);
  translateGraph(layoutGraph);
  assignNodeIntersects(layoutGraph);
  reversePointsForReversedEdges(layoutGraph);
  acyclic.undo(layoutGraph);
}

/**
 * Copies final layout information from the layout graph back to the input
 * graph. This process only copies whitelisted attributes from the layout graph
 * to the input graph, so it serves as a good place to determine what
 * attributes can influence layout.
 * 
 * @param {Graph<GraphLabel, NodeConfig, EdgeConfig>} inputGraph
 * @param {Graph<GraphLabel, NodeConfig, EdgeConfig>} layoutGraph
 */
function updateInputGraph(inputGraph, layoutGraph) {
  const nodes = inputGraph.nodes() || [];
  nodes.forEach((v) => {
    const inputLabel = inputGraph.node(v);
    const layoutLabel = layoutGraph.node(v);

    if (inputLabel) {
      inputLabel.x = layoutLabel.x;
      inputLabel.y = layoutLabel.y;

      if (layoutGraph.children(v).length) {
        inputLabel.width = layoutLabel.width;
        inputLabel.height = layoutLabel.height;
      }
    }
  });
  const edges = inputGraph.edges() || [];
  edges.forEach((e) => {
    const inputLabel = inputGraph.edge(e);
    const layoutLabel = layoutGraph.edge(e);

    inputLabel.points = layoutLabel.points;
    if (typeof layoutLabel.x === 'number') {
      inputLabel.x = layoutLabel.x;
      inputLabel.y = layoutLabel.y;
    }
  });

  inputGraph.graph().width = layoutGraph.graph().width;
  inputGraph.graph().height = layoutGraph.graph().height;
}

const graphNumAttrs = ["nodeSeparation", "edgeSeparation", "rankSeparation", "marginX", "marginY"];
const graphDefaults = { rankSeparation: 50, edgeSeparation: 20, nodeSeparation: 50, rankDir: "tb" };
const graphAttrs = ["acyclicer", "ranker", "rankDir", "align"];
const nodeNumAttrs = ["width", "height"];
const nodeDefaults = { width: 0, height: 0 };
const edgeNumAttrs = ["minLen", "weight", "width", "height", "labelOffset"];
const edgeDefaults = {
  minLen: 1, 
  weight: 1, 
  width: 0, 
  height: 0,
  labelOffset: 10, 
  labelPos: "r",
};
const edgeAttrs = ["labelPos"];

function canonicalize(attrs={}) {
  const newAttrs = {};
  for (const [k, v] of Object.entries(attrs)) {
    newAttrs[k] = v;
  }
  return newAttrs;
}

/**
 * @param {object} obj
 * @param {string[]} attrs
 * @returns {any} 
 */
function selectNumberAttrs(obj, attrs) {
  const picked = {};
  attrs.forEach((k) => {
    if (typeof obj[k] === 'number' || !!obj[k]) {
      picked[k] = Number(obj[k]);
    }
  });
  return picked;
}

/**
 * Constructs a new graph from the input graph, which can be used for layout.
 * This process copies only whitelisted attributes from the input graph to the
 * layout graph. Thus this function serves as a good place to determine what
 * attributes can influence layout.
 * 
 * @param {Graph<GraphLabel, NodeConfig, EdgeConfig>} inputGraph
 * @returns {Graph<GraphLabel, NodeConfig, EdgeConfig>}
 */
function buildLayoutGraph(inputGraph) {
  /** @type {Graph<GraphLabel, NodeConfig, EdgeConfig>} */
  const g = new Graph({ multigraph: true, compound: true });
  const graph = canonicalize(inputGraph.graph());

  const ga = {};
  graphAttrs.forEach((k) => {
    if (typeof graph[k] !== 'undefined' && graph[k] !== null) {
      ga[k] = graph[k];
    }
  });
  g.setGraph({
    ...graphDefaults,
    ...selectNumberAttrs(graph, graphNumAttrs),
    ...ga,
  });
  const nodes = inputGraph.nodes() || [];
  nodes.forEach((v) => {
    const node = canonicalize(inputGraph.node(v));
    const na = selectNumberAttrs(node, nodeNumAttrs);
    const value = {
      ...na,
    };
    Object.keys(nodeDefaults).forEach((k) => {
      if (typeof value[k] === 'undefined') {
        value[k] = nodeDefaults[k];
      }
    });
    g.setNode(v, value);
    g.setParent(v, inputGraph.parent(v));
  });

  const edges = inputGraph.edges() || [];
  edges.forEach((e) => {
    const edge = canonicalize(inputGraph.edge(e));
    const ea = {};
    edgeAttrs.forEach((k) => {
      if (typeof edge[k] !== 'undefined' && edge[k] !== null) {
        ea[k] = edge[k];
      }
    });
    const value = {
      ...edgeDefaults,
      ...selectNumberAttrs(edge, edgeNumAttrs),
      ...ea,
    };
    g.setEdge(e, value);
  });

  return g;
}

/**
 * @param {Graph<GraphLabel, NodeConfig, EdgeConfig>} g
 */
function layoutTiming(g) {
  time("layout", () => {
    const layoutGraph = time("  buildLayoutGraph", () => buildLayoutGraph(g));
    time("  runLayout",        () => { runLayoutTime(layoutGraph, time); });
    time("  updateInputGraph", () => { updateInputGraph(g, layoutGraph); });
  });
}

/**
 * @param {Graph<GraphLabel, NodeConfig, EdgeConfig>} g
 * @param {LayoutOptions=} opts
 */
export default function layout(g, opts={}) {
  if (opts.debugTiming) {
    layoutTiming(g);
  }
  const layoutGraph = buildLayoutGraph(g);
  runLayout(layoutGraph);
  updateInputGraph(g, layoutGraph);
}
