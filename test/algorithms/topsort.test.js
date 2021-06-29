import _ from 'lodash-es';
import { expect } from '@esm-bundle/chai';
import { Graph, algorithms } from "../../index.js";

const {topsort, CycleException} = algorithms;

describe("alg.topsort", () => {
  it("returns an empty array for an empty graph", () => {
    expect(topsort(new Graph())).to.be.empty;
  });

  it("sorts nodes such that earlier nodes have directed edges to later nodes", () => {
    const g = new Graph();
    g.setPath(["b", "c", "a"]);
    expect(topsort(g)).to.eql(["b", "c", "a"]);
  });

  it("works for a diamond", () => {
    const g = new Graph();
    g.setPath(["a", "b", "d"]);
    g.setPath(["a", "c", "d"]);

    const result = topsort(g);
    expect(_.indexOf(result, "a")).to.equal(0);
    expect(_.indexOf(result, "b")).to.be.lt(_.indexOf(result, "d"));
    expect(_.indexOf(result, "c")).to.be.lt(_.indexOf(result, "d"));
    expect(_.indexOf(result, "d")).to.equal(3);
  });

  it("throws CycleException if there is a cycle #1", () => {
    const g = new Graph();
    g.setPath(["b", "c", "a", "b"]);
    expect(() => { topsort(g); }).to.throw(CycleException);
  });

  it("throws CycleException if there is a cycle #2", () => {
    const g = new Graph();
    g.setPath(["b", "c", "a", "b"]);
    g.setEdge("b", "d");
    expect(() => { topsort(g); }).to.throw(CycleException);
  });

  it("throws CycleException if there is a cycle #3", () => {
    const g = new Graph();
    g.setPath(["b", "c", "a", "b"]);
    g.setNode("d");
    expect(() => { topsort(g); }).to.throw(CycleException);
  });
});
