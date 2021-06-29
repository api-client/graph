import _ from 'lodash-es';
import { expect } from '@esm-bundle/chai';
import { Graph, algorithms } from '../../index.js';
import greedyFAS from "../../src/layout/greedy-fas.js";

const { findCycles } = algorithms;

function checkFAS(g, fas) {
  const n = g.nodeCount();
  const m = g.edgeCount();
  _.forEach(fas, (edge) => {
    g.removeEdge(edge.v, edge.w);
  });
  expect(findCycles(g)).to.eql([]);
  // The more direct m/2 - n/6 fails for the simple cycle A <-> B, where one
  // edge must be reversed, but the performance bound implies that only 2/3rds
  // of an edge can be reversed. I'm using floors to account for this.
  expect(fas.length).to.be.lte(Math.floor(m/2) - Math.floor(n/6));
}

function weightFn(g) {
  return e => g.edge(e);
}

describe("greedyFAS", () => {
  /** @type Graph */
  let g;

  beforeEach(() => {
    g = new Graph();
  });

  it("returns the empty set for empty graphs", () => {
    expect(greedyFAS(g)).to.eql([]);
  });

  it("returns the empty set for single-node graphs", () => {
    g.setNode("a");
    expect(greedyFAS(g)).to.eql([]);
  });

  it("returns an empty set if the input graph is acyclic", () => {
    const graph = new Graph();
    graph.setEdge("a", "b");
    graph.setEdge("b", "c");
    graph.setEdge("b", "d");
    graph.setEdge("a", "e");
    expect(greedyFAS(graph)).to.eql([]);
  });

  it("returns a single edge with a simple cycle", () => {
    const graph = new Graph();
    graph.setEdge("a", "b");
    graph.setEdge("b", "a");
    checkFAS(graph, greedyFAS(graph));
  });

  it("returns a single edge in a 4-node cycle", () => {
    const graph = new Graph();
    graph.setEdge("n1", "n2");
    graph.setPath(["n2", "n3", "n4", "n5", "n2"]);
    graph.setEdge("n3", "n5");
    graph.setEdge("n4", "n2");
    graph.setEdge("n4", "n6");
    checkFAS(graph, greedyFAS(graph));
  });

  it("returns two edges for two 4-node cycles", () => {
    const graph = new Graph();
    graph.setEdge("n1", "n2");
    graph.setPath(["n2", "n3", "n4", "n5", "n2"]);
    graph.setEdge("n3", "n5");
    graph.setEdge("n4", "n2");
    graph.setEdge("n4", "n6");
    graph.setPath(["n6", "n7", "n8", "n9", "n6"]);
    graph.setEdge("n7", "n9");
    graph.setEdge("n8", "n6");
    graph.setEdge("n8", "n10");
    checkFAS(graph, greedyFAS(graph));
  });

  it("works with arbitrarily weighted edges", () => {
    // Our algorithm should also work for graphs with multi-edges, a graph
    // where more than one edge can be pointing in the same direction between
    // the same pair of incident nodes. We try this by assigning weights to
    // our edges representing the number of edges from one node to the other.

    const g1 = new Graph();
    g1.setEdge("n1", "n2", 2);
    g1.setEdge("n2", "n1", 1);
    expect(greedyFAS(g1, weightFn(g1))).to.eql([{v: "n2", w: "n1"}]);

    const g2 = new Graph();
    g2.setEdge("n1", "n2", 1);
    g2.setEdge("n2", "n1", 2);
    expect(greedyFAS(g2, weightFn(g2))).to.eql([{v: "n1", w: "n2"}]);
  });

  it("works for multigraphs", () => {
    const graph = new Graph({ multigraph: true });
    graph.setEdge("a", "b", 5, "foo");
    graph.setEdge("b", "a", 2, "bar");
    graph.setEdge("b", "a", 2, "baz");
    expect(_.sortBy(greedyFAS(graph, weightFn(graph)), "name")).to.eql([
      { v: "b", w: "a", name: "bar" },
      { v: "b", w: "a", name: "baz" }
    ]);
  });
});
