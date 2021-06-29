import _ from 'lodash-es';
import { expect } from '@esm-bundle/chai';
import { Graph, algorithms } from "../../index.js";

const { findCycles } = algorithms;

// A helper that sorts components and their contents
function sort(components) {
  return _.sortBy(_.map(components, component => _.sortBy(component)), list => list[0]);
}

describe("alg.findCycles", () => {
  it("returns an empty array for an empty graph", () => {
    expect(findCycles(new Graph())).to.eql([]);
  });

  it("returns an empty array if the graph has no cycles", () => {
    const g = new Graph();
    g.setPath(["a", "b", "c"]);
    expect(findCycles(g)).to.eql([]);
  });

  it("returns a single entry for a cycle of 1 node", () => {
    const g = new Graph();
    g.setPath(["a", "a"]);
    expect(sort(findCycles(g))).to.eql([["a"]]);
  });

  it("returns a single entry for a cycle of 2 nodes", () => {
    const g = new Graph();
    g.setPath(["a", "b", "a"]);
    expect(sort(findCycles(g))).to.eql([["a", "b"]]);
  });

  it("returns a single entry for a triangle", () => {
    const g = new Graph();
    g.setPath(["a", "b", "c", "a"]);
    expect(sort(findCycles(g))).to.eql([["a", "b", "c"]]);
  });

  it("returns multiple entries for multiple cycles", () => {
    const g = new Graph();
    g.setPath(["a", "b", "a"]);
    g.setPath(["c", "d", "e", "c"]);
    g.setPath(["f", "g", "g"]);
    g.setNode("h");
    expect(sort(findCycles(g))).to.eql([["a", "b"], ["c", "d", "e"], ["g"]]);
  });
});
