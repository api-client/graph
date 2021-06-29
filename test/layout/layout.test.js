import _ from 'lodash-es';
import { expect } from '@esm-bundle/chai';
import { layout, Graph } from "../../index.js";

/** @typedef {import('../../src/layout/types').GraphLabel} GraphLabel */
/** @typedef {import('../../src/layout/types').NodeConfig} NodeConfig */
/** @typedef {import('../../src/layout/types').EdgeConfig} EdgeConfig */

function extractCoordinates(g) {
  const nodes = g.nodes();
  return _.zipObject(nodes, _.map(nodes, v => _.pick(g.node(v), ["x", "y"])));
}

describe("layout", () => {
  /** @type Graph<GraphLabel, NodeConfig, EdgeConfig> */
  let g;

  beforeEach(() => {
    g = new Graph({ multigraph: true, compound: true })
      .setGraph({})
      .setDefaultEdgeLabel(() => ({}));
  });

  it("can layout a single node", () => {
    g.setNode("a", { width: 50, height: 100 });
    layout(g);
    expect(extractCoordinates(g)).to.eql({
      a: { x: 50 / 2, y: 100 / 2 }
    });
    expect(g.node("a").x).to.equal(50 / 2);
    expect(g.node("a").y).to.equal(100 / 2);
  });

  it("can layout two nodes on the same rank", () => {
    g.graph().nodeSeparation = 200;
    g.setNode("a", { width: 50, height: 100 });
    g.setNode("b", { width: 75, height: 200 });
    layout(g);
    expect(extractCoordinates(g)).to.eql({
      a: { x: 50 / 2,            y: 200 / 2 },
      b: { x: 50 + 200 + 75 / 2, y: 200 / 2 }
    });
  });

  it("can layout two nodes connected by an edge", () => {
    g.graph().rankSeparation = 300;
    g.setNode("a", { width: 50, height: 100 });
    g.setNode("b", { width: 75, height: 200 });
    g.setEdge("a", "b");
    layout(g);
    expect(extractCoordinates(g)).to.eql({
      a: { x: 75 / 2, y: 100 / 2 },
      b: { x: 75 / 2, y: 100 + 300 + 200 / 2 }
    });

    // We should not get x, y coordinates if the edge has no label
    expect(g.edge("a", "b")).to.not.have.property("x");
    expect(g.edge("a", "b")).to.not.have.property("y");
  });

  it("can layout an edge with a label", () => {
    g.graph().rankSeparation = 300;
    g.setNode("a", { width: 50, height: 100 });
    g.setNode("b", { width: 75, height: 200 });
    g.setEdge("a", "b", { width: 60, height: 70, labelPos: "c" });
    layout(g);
    expect(extractCoordinates(g)).to.eql({
      a: { x: 75 / 2, y: 100 / 2 },
      b: { x: 75 / 2, y: 100 + 150 + 70 + 150 + 200 / 2 }
    });
    expect(_.pick(g.edge("a", "b"), ["x", "y"]))
      .eqls({ x: 75 / 2, y: 100  + 150 + 70 / 2 });
  });

  describe("can layout an edge with a long label, with rankDir =", () => {
    _.forEach(["TB", "BT", "LR", "RL"], (rankDir) => {
      it(rankDir, () => {
        g.graph().nodeSeparation = 10;
        g.graph().edgeSeparation = 10;
        g.graph().rankDir = rankDir;
        _.forEach(["a", "b", "c", "d"], (v) => {
          g.setNode(v, { width: 10, height: 10 });
        });
        g.setEdge("a", "c", { width: 2000, height: 10, labelPos: "c" });
        g.setEdge("b", "d", { width: 1, height: 1 });
        layout(g);

        let p1; let p2;
        if (rankDir === "TB" || rankDir === "BT") {
          p1 = g.edge("a", "c");
          p2 = g.edge("b", "d");
        } else {
          p1 = g.node("a");
          p2 = g.node("c");
        }

        expect(Math.abs(p1.x - p2.x)).gt(1000);
      });
    });
  });

  describe("can apply an offset, with rankDir =", () => {
    _.forEach(["TB", "BT", "LR", "RL"], (rankDir) => {
      it(rankDir, () => {
        g.graph().nodeSeparation = 10;
        g.graph().edgeSeparation = 10
        g.graph().rankDir = rankDir;
        _.forEach(["a", "b", "c", "d"], (v) => {
          g.setNode(v, { width: 10, height: 10 });
        });
        g.setEdge("a", "b", { width: 10, height: 10, labelPos: "l", labelOffset: 1000 });
        g.setEdge("c", "d", { width: 10, height: 10, labelPos: "r", labelOffset: 1000 });
        layout(g);

        if (rankDir === "TB" || rankDir === "BT") {
          expect(g.edge("a", "b").x - g.edge("a", "b").points[0].x).equals(-1000 - 10 / 2);
          expect(g.edge("c", "d").x - g.edge("c", "d").points[0].x).equals(1000 + 10 / 2);
        } else {
          expect(g.edge("a", "b").y - g.edge("a", "b").points[0].y).equals(-1000 - 10 / 2);
          expect(g.edge("c", "d").y - g.edge("c", "d").points[0].y).equals(1000 + 10 / 2);
        }
      });
    });
  });

  it("can layout a long edge with a label", () => {
    g.graph().rankSeparation = 300;
    g.setNode("a", { width: 50, height: 100 });
    g.setNode("b", { width: 75, height: 200 });
    g.setEdge("a", "b", { width: 60, height: 70, minLen: 2, labelPos: "c" });
    layout(g);
    expect(g.edge("a", "b").x).to.equal(75 / 2);
    expect(g.edge("a", "b").y)
      .to.be.gt(g.node("a").y)
      .to.be.lt(g.node("b").y);
  });

  it("can layout out a short cycle", () => {
    g.graph().rankSeparation = 200;
    g.setNode("a", { width: 100, height: 100 });
    g.setNode("b", { width: 100, height: 100 });
    g.setEdge("a", "b", { weight: 2 });
    g.setEdge("b", "a");
    layout(g);
    expect(extractCoordinates(g)).to.eql({
      a: { x: 100 / 2, y: 100 / 2 },
      b: { x: 100 / 2, y: 100 + 200 + 100 / 2}
    });
    // One arrow should point down, one up
    expect(g.edge("a", "b").points[1].y).gt(g.edge("a", "b").points[0].y);
    expect(g.edge("b", "a").points[0].y).gt(g.edge("b", "a").points[1].y);
  });

  it("adds rectangle intersects for edges", () => {
    g.graph().rankSeparation = 200;
    g.setNode("a", { width: 100, height: 100 });
    g.setNode("b", { width: 100, height: 100 });
    g.setEdge("a", "b");
    layout(g);
    const {points} = g.edge("a", "b");
    expect(points).to.have.length(3);
    expect(points).eqls([
      { x: 100 / 2, y: 100 },           // intersect with bottom of a
      { x: 100 / 2, y: 100 + 200 / 2 }, // point for edge label
      { x: 100 / 2, y: 100 + 200 }      // intersect with top of b
    ]);
  });

  it("adds rectangle intersects for edges spanning multiple ranks", () => {
    g.graph().rankSeparation = 200;
    g.setNode("a", { width: 100, height: 100 });
    g.setNode("b", { width: 100, height: 100 });
    g.setEdge("a", "b", { minLen: 2 });
    layout(g);
    const {points} = g.edge("a", "b");
    expect(points).to.have.length(5);
    expect(points).eqls([
      { x: 100 / 2, y: 100 },           // intersect with bottom of a
      { x: 100 / 2, y: 100 + 200 / 2 }, // bend #1
      { x: 100 / 2, y: 100 + 400 / 2 }, // point for edge label
      { x: 100 / 2, y: 100 + 600 / 2 }, // bend #2
      { x: 100 / 2, y: 100 + 800 / 2 }  // intersect with top of b
    ]);
  });

  describe("can layout a self loop", () => {
    _.forEach(["TB", "BT", "LR", "RL"], (rankDir) => {
      it (`in rankDir = ${  rankDir}`, () => {
        g.graph().edgeSeparation = 75;
        g.graph().rankDir = rankDir;
        g.setNode("a", { width: 100, height: 100 });
        g.setEdge("a", "a", { width: 50, height: 50 });
        layout(g);
        const nodeA = g.node("a");
        const {points} = g.edge("a", "a");
        expect(points).to.have.length(7);
        _.forEach(points, (point) => {
          if (rankDir !== "LR" && rankDir !== "RL") {
            expect(point.x).gt(nodeA.x);
            expect(Math.abs(point.y - nodeA.y)).lte(nodeA.height / 2);
          } else {
            expect(point.y).gt(nodeA.y);
            expect(Math.abs(point.x - nodeA.x)).lte(nodeA.width / 2);
          }
        });
      });
    });
  });

  it("can layout a graph with subgraphs", () => {
    // To be expanded, this primarily ensures nothing blows up for the moment.
    g.setNode("a", { width: 50, height: 50 });
    g.setParent("a", "sg1");
    layout(g);
  });

  it("minimizes the height of subgraphs", () => {
    _.forEach(["a", "b", "c", "d", "x", "y"], (v) => {
      g.setNode(v, { width: 50, height: 50 });
    });
    g.setPath(["a", "b", "c", "d"]);
    g.setEdge("a", "x", { weight: 100 });
    g.setEdge("y", "d", { weight: 100 });
    g.setParent("x", "sg");
    g.setParent("y", "sg");

    // We did not set up an edge (x, y), and we set up high-weight edges from
    // outside of the subgraph to nodes in the subgraph. This is to try to
    // force nodes x and y to be on different ranks, which we want our ranker
    // to avoid.
    layout(g);
    expect(g.node("x").y).to.equal(g.node("y").y);
  });

  it("can layout subgraphs with different rankDirs", () => {
    g.setNode("a", { width: 50, height: 50 });
    g.setNode("sg", {});
    g.setParent("a", "sg");

    function check(rankDir) {
      expect(g.node("sg").width, `width ${rankDir}`).gt(50);
      expect(g.node("sg").height, `height ${rankDir}`).gt(50);
      expect(g.node("sg").x, `x ${rankDir}`).gt(50 / 2);
      expect(g.node("sg").y, `y ${rankDir}`).gt(50 / 2);
    }

    ["tb", "bt", "lr", "rl"].forEach((rankDir) => {
      g.graph().rankDir = rankDir;
      layout(g);
      check(rankDir);
    });
  });

  it("adds dimensions to the graph", () => {
    g.setNode("a", { width: 100, height: 50 });
    layout(g);
    expect(g.graph().width).equals(100);
    expect(g.graph().height).equals(50);
  });

  describe("ensures all coordinates are in the bounding box for the graph", () => {
    _.forEach(["TB", "BT", "LR", "RL"], (rankDir) => {
      describe(rankDir, () => {
        beforeEach(() => {
          g.graph().rankDir = rankDir;
        });

        it("node", () => {
          g.setNode("a", { width: 100, height: 200 });
          layout(g);
          expect(g.node("a").x).equals(100 / 2);
          expect(g.node("a").y).equals(200 / 2);
        });

        it("edge, labelPos = l", () => {
          g.setNode("a", { width: 100, height: 100 });
          g.setNode("b", { width: 100, height: 100 });
          g.setEdge("a", "b", {
            width: 1000, height: 2000, labelPos: "l", labelOffset: 0
          });
          layout(g);
          if (rankDir === "TB" || rankDir === "BT") {
            expect(g.edge("a", "b").x).equals(1000 / 2);
          } else {
            expect(g.edge("a", "b").y).equals(2000 / 2);
          }
        });
      });
    });
  });
});
