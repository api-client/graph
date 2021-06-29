import _ from 'lodash-es';
import { expect } from '@esm-bundle/chai';
import { Graph } from '../../index.js';
import sortSubgraph from "../../src/layout/order/sort-subgraph.js";

describe("order/sortSubgraph", () => {
  /** @type Graph */
  let g; 
  /** @type Graph */
  let cg;

  beforeEach(() => {
    g = new Graph({ compound: true })
      .setDefaultNodeLabel(() => ({}))
      .setDefaultEdgeLabel(() => ({ weight: 1 }));
    _.forEach(_.range(5), (v) => { g.setNode(v, { order: v }); });
    cg = new Graph();
  });

  it("sorts a flat subgraph based on barycenter", () => {
    g.setEdge(3, "x");
    g.setEdge(1, "y", { weight: 2 });
    g.setEdge(4, "y");
    _.forEach(["x", "y"], (v) => { g.setParent(v, "movable"); });

    expect(sortSubgraph(g, "movable", cg).vs).eqls(["y", "x"]);
  });

  it("preserves the pos of a node (y) w/o neighbors in a flat subgraph", () => {
    g.setEdge(3, "x");
    g.setNode("y");
    g.setEdge(1, "z", { weight: 2 });
    g.setEdge(4, "z");
    _.forEach(["x", "y", "z"], (v) => { g.setParent(v, "movable"); });

    expect(sortSubgraph(g, "movable", cg).vs).eqls(["z", "y", "x"]);
  });

  it("biases to the left without reverse bias", () => {
    g.setEdge(1, "x");
    g.setEdge(1, "y");
    _.forEach(["x", "y"], (v) => { g.setParent(v, "movable"); });

    expect(sortSubgraph(g, "movable", cg).vs).eqls(["x", "y"]);
  });

  it("biases to the right with reverse bias", () => {
    g.setEdge(1, "x");
    g.setEdge(1, "y");
    _.forEach(["x", "y"], (v) => { g.setParent(v, "movable"); });

    expect(sortSubgraph(g, "movable", cg, true).vs).eqls(["y", "x"]);
  });

  it("aggregates stats about the subgraph", () => {
    g.setEdge(3, "x");
    g.setEdge(1, "y", { weight: 2 });
    g.setEdge(4, "y");
    _.forEach(["x", "y"], (v) => { g.setParent(v, "movable"); });

    const results = sortSubgraph(g, "movable", cg);
    expect(results.barycenter).to.equal(2.25);
    expect(results.weight).to.equal(4);
  });

  it("can sort a nested subgraph with no barycenter", () => {
    g.setNodes(["a", "b", "c"]);
    g.setParent("a", "y");
    g.setParent("b", "y");
    g.setParent("c", "y");
    g.setEdge(0, "x");
    g.setEdge(1, "z");
    g.setEdge(2, "y");
    _.forEach(["x", "y", "z"], (v) => { g.setParent(v, "movable"); });

    expect(sortSubgraph(g, "movable", cg).vs).eqls(["x", "z", "a", "b", "c"]);
  });

  it("can sort a nested subgraph with a barycenter", () => {
    g.setNodes(["a", "b", "c"]);
    g.setParent("a", "y");
    g.setParent("b", "y");
    g.setParent("c", "y");
    g.setEdge(0, "a", { weight: 3 });
    g.setEdge(0, "x");
    g.setEdge(1, "z");
    g.setEdge(2, "y");
    _.forEach(["x", "y", "z"], (v) => { g.setParent(v, "movable"); });

    expect(sortSubgraph(g, "movable", cg).vs).eqls(["x", "a", "b", "c", "z"]);
  });

  it("can sort a nested subgraph with no in-edges", () => {
    g.setNodes(["a", "b", "c"]);
    g.setParent("a", "y");
    g.setParent("b", "y");
    g.setParent("c", "y");
    g.setEdge(0, "a");
    g.setEdge(1, "b");
    g.setEdge(0, "x");
    g.setEdge(1, "z");
    _.forEach(["x", "y", "z"], (v) => { g.setParent(v, "movable"); });

    expect(sortSubgraph(g, "movable", cg).vs).eqls(["x", "a", "b", "c", "z"]);
  });

  it("sorts border nodes to the extremes of the subgraph", () => {
    g.setEdge(0, "x");
    g.setEdge(1, "y");
    g.setEdge(2, "z");
    g.setNode("sg1", { borderLeft: "bl", borderRight: "br" });
    _.forEach(["x", "y", "z", "bl", "br"], (v) => { g.setParent(v, "sg1"); });
    expect(sortSubgraph(g, "sg1", cg).vs).eqls(["bl", "x", "y", "z", "br"]);
  });

  it("assigns a barycenter to a subgraph based on previous border nodes", () => {
    g.setNode("bl1", { order: 0 });
    g.setNode("br1", { order: 1 });
    g.setEdge("bl1", "bl2");
    g.setEdge("br1", "br2");
    _.forEach(["bl2", "br2"], (v) => { g.setParent(v, "sg"); });
    g.setNode("sg", { borderLeft: "bl2", borderRight: "br2" });
    expect(sortSubgraph(g, "sg", cg)).eqls({
      barycenter: 0.5,
      weight: 2,
      vs: ["bl2", "br2"]
    });
  });
});
