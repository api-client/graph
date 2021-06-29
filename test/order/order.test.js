import _ from 'lodash-es';
import { expect } from '@esm-bundle/chai';
import { Graph } from '../../index.js';
import order from "../../src/layout/order/index.js";
import crossCount from "../../src/layout/order/cross-count.js";
import { buildLayerMatrix } from "../../src/layout/util.js";

describe("order", () => {
  let g;

  beforeEach(() => {
    g = new Graph();
    // @ts-ignore
    g.setDefaultEdgeLabel({ weight: 1 });
  });

  it("does not add crossings to a tree structure", () => {
    g.setNode("a", { rank: 1 });
    _.forEach(["b", "e"], (v) => { g.setNode(v, { rank: 2 }); });
    _.forEach(["c", "d", "f"], (v) => { g.setNode(v, { rank: 3 }); });
    g.setPath(["a", "b", "c"]);
    g.setEdge("b", "d");
    g.setPath(["a", "e", "f"]);
    order(g);
    const layering = buildLayerMatrix(g);
    expect(crossCount(g, layering)).to.equal(0);
  });

  it("can solve a simple graph", () => {
    // This graph resulted in a single crossing for previous versions of dagre.
    _.forEach(["a", "d"], (v) => { g.setNode(v, { rank: 1 }); });
    _.forEach(["b", "f", "e"], (v) => { g.setNode(v, { rank: 2 }); });
    _.forEach(["c", "g"], (v) => { g.setNode(v, { rank: 3 }); });
    order(g);
    const layering = buildLayerMatrix(g);
    expect(crossCount(g, layering)).to.equal(0);
  });

  it("can minimize crossings", () => {
    g.setNode("a", { rank: 1 });
    _.forEach(["b", "e", "g"], (v) => { g.setNode(v, { rank: 2 }); });
    _.forEach(["c", "f", "h"], (v) => { g.setNode(v, { rank: 3 }); });
    g.setNode("d", { rank: 4 });
    order(g);
    const layering = buildLayerMatrix(g);
    expect(crossCount(g, layering)).to.be.lte(1);
  });
});
