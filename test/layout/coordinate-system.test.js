import { expect } from '@esm-bundle/chai';
import { Graph } from '../../index.js';
import * as coordinateSystem from "../../src/layout/coordinate-system.js";

describe("coordinateSystem", () => {
  /** @type Graph */
  let g;

  beforeEach(() => {
    g = new Graph();
  });

  describe("coordinateSystem.adjust", () => {
    beforeEach(() => {
      g.setNode("a", { width: 100, height: 200 });
    });

    it("does nothing to node dimensions with rankDir = TB", () => {
      g.setGraph({ rankDir: "TB" });
      coordinateSystem.adjust(g);
      expect(g.node("a")).eqls({ width: 100, height: 200 });
    });

    it("does nothing to node dimensions with rankDir = BT", () => {
      g.setGraph({ rankDir: "BT" });
      coordinateSystem.adjust(g);
      expect(g.node("a")).eqls({ width: 100, height: 200 });
    });

    it("swaps width and height for nodes with rankDir = LR", () => {
      g.setGraph({ rankDir: "LR" });
      coordinateSystem.adjust(g);
      expect(g.node("a")).eqls({ width: 200, height: 100 });
    });

    it("swaps width and height for nodes with rankDir = RL", () => {
      g.setGraph({ rankDir: "RL" });
      coordinateSystem.adjust(g);
      expect(g.node("a")).eqls({ width: 200, height: 100 });
    });
  });

  describe("coordinateSystem.undo", () => {
    beforeEach(() => {
      g.setNode("a", { width: 100, height: 200, x: 20, y: 40 });
    });

    it("does nothing to points with rankDir = TB", () => {
      g.setGraph({ rankDir: "TB" });
      coordinateSystem.undo(g);
      expect(g.node("a")).eqls({ x: 20, y: 40, width: 100, height: 200 });
    });

    it("flips the y coordinate for points with rankDir = BT", () => {
      g.setGraph({ rankDir: "BT" });
      coordinateSystem.undo(g);
      expect(g.node("a")).eqls({ x: 20, y: -40, width: 100, height: 200 });
    });

    it("swaps dimensions and coordinates for points with rankDir = LR", () => {
      g.setGraph({ rankDir: "LR" });
      coordinateSystem.undo(g);
      expect(g.node("a")).eqls({ x: 40, y: 20, width: 200, height: 100 });
    });

    it("swaps dims and coords and flips x for points with rankDir = RL", () => {
      g.setGraph({ rankDir: "RL" });
      coordinateSystem.undo(g);
      expect(g.node("a")).eqls({ x: -40, y: 20, width: 200, height: 100 });
    });
  });
});
