/* eslint-disable no-param-reassign */

/** @typedef {import('../graph/Graph').Graph} Graph */
/** @typedef {import('./types').DummyNodeAttributes} DummyNodeAttributes */

/**
 * @param {DummyNodeAttributes} attrs
 */
function swapWidthHeightOne(attrs) {
  const w = attrs.width;
  attrs.width = attrs.height;
  attrs.height = w;
}

/**
 * @param {Graph} g
 */
function swapWidthHeight(g) {
  const nodes = g.nodes();
  if (Array.isArray(nodes)) {
    nodes.forEach(v => swapWidthHeightOne(g.node(v)))
  }
  const edges = g.edges();
  if (Array.isArray(edges)) {
    edges.forEach(e => swapWidthHeightOne(g.edge(e)));
  }
}

/**
 * @param {DummyNodeAttributes} attrs
 */
function reverseYOne(attrs) {
  attrs.y = -attrs.y;
}

/**
 * @param {Graph} g
 */
function reverseY(g) {
  const nodes = g.nodes();
  if (Array.isArray(nodes)) {
    nodes.forEach(v => reverseYOne(g.node(v)))
  }
  const edges = g.edges();
  if (Array.isArray(edges)) {
    edges.forEach((e) => {
      const edge = g.edge(e);
      const { points } = edge;
      if (Array.isArray(points)) {
        points.forEach(reverseYOne);
      }
      if (typeof edge.y === 'number') {
        reverseYOne(edge);
      }
    });
  }
}

/**
 * @param {DummyNodeAttributes} attrs
 */
function swapXYOne(attrs) {
  const { x } = attrs;
  attrs.x = attrs.y;
  attrs.y = x;
}

/**
 * @param {Graph} g
 */
function swapXY(g) {
  const nodes = g.nodes();
  if (Array.isArray(nodes)) {
    nodes.forEach(v => swapXYOne(g.node(v)))
  }
  const edges = g.edges();
  if (Array.isArray(edges)) {
    edges.forEach((e) => {
      const edge = g.edge(e);
      

      const { points } = edge;
      if (Array.isArray(points)) {
        points.forEach(swapXYOne);
      }
      if (typeof edge.x === 'number') {
        swapXYOne(edge);
      }
    });
  }
}

/**
 * @param {Graph} g
 */
export function adjust(g) {
  const rankDir = g.graph().rankDir.toLowerCase();
  if (rankDir === "lr" || rankDir === "rl") {
    swapWidthHeight(g);
  }
}

/**
 * @param {Graph} g
 */
export function undo(g) {
  const rankDir = g.graph().rankDir.toLowerCase();
  if (rankDir === "bt" || rankDir === "rl") {
    reverseY(g);
  }

  if (rankDir === "lr" || rankDir === "rl") {
    swapXY(g);
    swapWidthHeight(g);
  }
}
