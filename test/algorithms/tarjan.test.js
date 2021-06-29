import _ from 'lodash-es';
import { expect } from '@esm-bundle/chai';
import { Graph, algorithms } from "../../index.js";

const {tarjan} = algorithms;

// A helper that sorts components and their contents
function sort(components) {
  return _.sortBy(_.map(components, component => _.sortBy(component)), list => list[0]);
}


describe("alg.tarjan", () => {
  it("returns an empty array for an empty graph", () => {
    expect(tarjan(new Graph())).to.eql([]);
  });

  it("returns singletons for nodes not in a strongly connected component", () => {
    const g = new Graph();
    g.setPath(["a", "b", "c"]);
    g.setEdge("d", "c");
    expect(sort(tarjan(g))).to.eql([["a"], ["b"], ["c"], ["d"]]);
  });

  it("returns a single component for a cycle of 1 edge", () => {
    const g = new Graph();
    g.setPath(["a", "b", "a"]);
    expect(sort(tarjan(g))).to.eql([["a", "b"]]);
  });

  it("returns a single component for a triangle", () => {
    const g = new Graph();
    g.setPath(["a", "b", "c", "a"]);
    expect(sort(tarjan(g))).to.eql([["a", "b", "c"]]);
  });

  it("can find multiple components", () => {
    const g = new Graph();
    g.setPath(["a", "b", "a"]);
    g.setPath(["c", "d", "e", "c"]);
    g.setNode("f");
    expect(sort(tarjan(g))).to.eql([["a", "b"], ["c", "d", "e"], ["f"]]);
  });
});
