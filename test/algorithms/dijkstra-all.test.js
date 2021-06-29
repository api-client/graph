import { expect } from '@esm-bundle/chai';
import { Graph, algorithms } from "../../index.js";
import allShortestPathsTest from "./all-shortest-paths-test.js";

const { dijkstraAll } = algorithms;

function weightFn(g) {
  return e => g.edge(e);
}

describe("alg.dijkstraAll", () => {
  allShortestPathsTest(dijkstraAll);

  it("throws an Error if it encounters a negative edge weight", () => {
    const g = new Graph({ multigraph: true });
    g.setEdge("a", "b",  1);
    g.setEdge("a", "c", -2);
    g.setEdge("b", "d",  3);
    g.setEdge("c", "d",  3);

    expect(() => { dijkstraAll(g, weightFn(g)); }).to.throw();
  });
});
