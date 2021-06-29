import _ from 'lodash-es';
import { expect } from '@esm-bundle/chai';
import { Graph, algorithms } from "../../index.js";

// const {components} = require("../..").alg;

describe("alg.components", () => {
  it("returns an empty list for an empty graph", () => {
    expect(algorithms.components(new Graph({ directed: false }))).to.be.empty;
  });

  it("returns singleton lists for unconnected nodes", () => {
    const g = new Graph({ directed: false });
    g.setNode("a");
    g.setNode("b");

    const result = _.sortBy(algorithms.components(g), arr => _.min(arr));
    expect(result).to.eql([["a"], ["b"]]);
  });

  it("returns a list of nodes in a component", () => {
    const g = new Graph({ directed: false });
    g.setEdge("a", "b");
    g.setEdge("b", "c");

    const result = _.map(algorithms.components(g), xs => _.sortBy(xs));
    expect(result).to.eql([["a", "b", "c"]]);
  });

  it("returns nodes connected by a neighbor relationship in a digraph", () => {
    const g = new Graph();
    g.setPath(["a", "b", "c", "a"]);
    g.setEdge("d", "c");
    g.setEdge("e", "f");

    const result = _.sortBy(_.map(algorithms.components(g),
      xs => _.sortBy(xs)), "0");
    expect(result).to.eql([["a", "b", "c", "d"], ["e", "f"]]);
  });
});
