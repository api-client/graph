import { Graph } from '../graph/Graph.js';
import { buildLayerMatrix } from "./util.js";


/** 
 * @param {Graph} g
 */
export function debugOrdering(g) {
  const layerMatrix = buildLayerMatrix(g);

  const h = new Graph({ compound: true, multigraph: true }).setGraph({});

  const nodes = g.nodes();
  if (nodes) {
    nodes.forEach((v) => {
      h.setNode(v, { label: v });
      h.setParent(v, `layer${  g.node(v).rank}`);
    });
  }

  const edges = g.edges();
  if (edges) {
    edges.forEach((e) => {
      h.setEdge(e.v, e.w, {}, e.name);
    });
  }

  if (Array.isArray(layerMatrix)) {
    layerMatrix.forEach((layer, i) => {
      const layerV = `layer${i}`;
      h.setNode(layerV, { rank: "same" });
      if (Array.isArray(layer)) {
        layer.reduce((u, v) => {
          h.setEdge(u, v, { style: "invisible" });
          return v;
        });
      }
    });
  }
  return h;
}
