import _ from 'lodash-es';
import { expect } from '@esm-bundle/chai';
import { Graph } from '../../index.js';
import initOrder from "../../src/layout/order/init-order.js";

describe("order/initOrder", () => {
  /** @type Graph */
  let g;

  beforeEach(() => {
    g = new Graph({ compound: true })
    .setDefaultEdgeLabel(() => ({ weight: 1 }));
  });

  it("assigns non-overlapping orders for each rank in a tree", () => {
    _.forEach({ a: 0, b: 1, c: 2, d: 2, e: 1 }, (rank, v) => {
      g.setNode(v, { rank });
    });
    g.setPath(["a", "b", "c"]);
    g.setEdge("b", "d");
    g.setEdge("a", "e");

    const layering = initOrder(g);
    expect(layering[0]).to.eql(["a"]);
    expect(_.sortBy(layering[1])).to.eql(["b", "e"]);
    expect(_.sortBy(layering[2])).to.eql(["c", "d"]);
  });

  it("assigns non-overlapping orders for each rank in a DAG", () => {
    _.forEach({ a: 0, b: 1, c: 1, d: 2 }, (rank, v) => {
      g.setNode(v, { rank });
    });
    g.setPath(["a", "b", "d"]);
    g.setPath(["a", "c", "d"]);

    const layering = initOrder(g);
    expect(layering[0]).to.eql(["a"]);
    expect(_.sortBy(layering[1])).to.eql(["b", "c"]);
    expect(_.sortBy(layering[2])).to.eql(["d"]);
  });

  it("does not assign an order to subgraph nodes", () => {
    g.setNode("a", { rank: 0 });
    g.setNode("sg1", {});
    g.setParent("a", "sg1");

    const layering = initOrder(g);
    expect(layering).to.eql([["a"]]);
  });
});
