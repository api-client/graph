/* eslint-disable no-param-reassign */
import { positionX } from "./bk.js";
import { asNonCompoundGraph, buildLayerMatrix } from "../util.js";

/** @typedef {import('../../graph/Graph').Graph} Graph */

/**
 * @param {Graph} g
 */
function positionY(g) {
  const layering = buildLayerMatrix(g);
  const { rankSeparation } = g.graph();
  let prevY = 0;
  (layering || []).forEach((layer) => {
    const heights = /** @type number[] */ (layer.map(v => g.node(v).height));
    const maxHeight = Math.max(...heights);
    layer.forEach((v) => {
      g.node(v).y = prevY + maxHeight / 2;
    });
    prevY += maxHeight + rankSeparation;
  });
}

/**
 * @param {Graph} g
 */
export default function position(g) {
  const graph = asNonCompoundGraph(g);
  
  positionY(graph);
  const positioned = positionX(graph);
  Object.entries(positioned).forEach(([v, x]) => {
    g.node(v).x = x;
  });
}
