import _ from 'lodash-es';
import { expect } from '@esm-bundle/chai';
import { Graph, algorithms } from "../../index.js";

const { preOrder } = algorithms;

describe("alg.preorder", () => {
  it("returns the root for a singleton graph", () => {
    const g = new Graph();
    g.setNode("a");
    expect(preOrder(g, "a")).to.eql(["a"]);
  });

  it("visits each node in the graph once", () => {
    const g = new Graph();
    g.setPath(["a", "b", "d", "e"]);
    g.setPath(["a", "c", "d", "e"]);

    const nodes = preOrder(g, "a");
    expect(_.sortBy(nodes)).to.eql(["a", "b", "c", "d", "e"]);
  });

  it("works for a tree", () => {
    const g = new Graph();
    g.setEdge("a", "b");
    g.setPath(["a", "c", "d"]);
    g.setEdge("c", "e");

    const nodes = preOrder(g, "a");
    expect(_.sortBy(nodes)).to.eql(["a", "b", "c", "d", "e"]);
    expect(nodes.indexOf("b")).to.be.gt(nodes.indexOf("a"));
    expect(nodes.indexOf("c")).to.be.gt(nodes.indexOf("a"));
    expect(nodes.indexOf("d")).to.be.gt(nodes.indexOf("c"));
    expect(nodes.indexOf("e")).to.be.gt(nodes.indexOf("c"));
  });

  it("works for an array of roots", () => {
    const g = new Graph();
    g.setEdge("a", "b");
    g.setEdge("c", "d");
    g.setNode("e");
    g.setNode("f");

    const nodes = preOrder(g, ["a", "c", "e"]);
    expect(_.sortBy(nodes)).to.eql(["a", "b", "c", "d", "e"]);
    expect(nodes.indexOf("b")).to.be.gt(nodes.indexOf("a"));
    expect(nodes.indexOf("d")).to.be.gt(nodes.indexOf("c"));
  });

  it("fails if root is not in the graph", () => {
    const g = new Graph();
    g.setNode("a");
    expect(() => { preOrder(g, "b"); }).to.throw();
  });
});
