import _ from 'lodash-es';
import { expect } from '@esm-bundle/chai';
import { PriorityQueue } from "../../src/data/PriorityQueue.js";

describe("PriorityQueue", () => {
  /** @type PriorityQueue */
  let pq;

  beforeEach(() => {
    pq = new PriorityQueue();
  });

  describe("size", () => {
    it("returns 0 for an empty queue", () => {
      expect(pq.size()).to.equal(0);
    });

    it("returns the number of elements in the queue", () => {
      pq.add("a", 1);
      expect(pq.size()).to.equal(1);
      pq.add("b", 2);
      expect(pq.size()).to.equal(2);
    });
  });

  describe("keys", () => {
    it("returns all of the keys in the queue", () => {
      pq.add("a", 1);
      pq.add(1, 2);
      pq.add(false, 3);
      pq.add(undefined, 4);
      pq.add(null, 5);
      expect(_.sortBy(pq.keys())).to.eql(
        _.sortBy(["a", "1", "false", "undefined", "null"]));
    });
  });

  describe("has", () => {
    it("returns true if the key is in the queue", () => {
      pq.add("a", 1);
      expect(pq.has("a")).to.be.true;
    });

    it("returns false if the key is not in the queue", () => {
      expect(pq.has("a")).to.be.false;
    });
  });

  describe("priority", () => {
    it("returns the current priority for the key", () => {
      pq.add("a", 1);
      pq.add("b", 2);
      expect(pq.priority("a")).to.equal(1);
      expect(pq.priority("b")).to.equal(2);
    });

    it("returns undefined if the key is not in the queue", () => {
      expect(pq.priority("foo")).to.be.undefined;
    });
  });

  describe("min", () => {
    it("throws an error if there is no element in the queue", () => {
      expect(() => { pq.min(); }).to.throw();
    });

    it("returns the smallest element", () => {
      pq.add("b", 2);
      pq.add("a", 1);
      expect(pq.min()).to.equal("a");
    });

    it("does not remove the minimum element from the queue", () => {
      pq.add("b", 2);
      pq.add("a", 1);
      pq.min();
      expect(pq.size()).to.equal(2);
    });
  });

  describe("add", () => {
    it("adds the key to the queue", () => {
      pq.add("a", 1);
      expect(pq.keys()).to.eql(["a"]);
    });

    it("returns true if the key was added", () => {
      expect(pq.add("a", 1)).to.be.true;
    });

    it("returns false if the key already exists in the queue", () => {
      pq.add("a", 1);
      expect(pq.add("a", 1)).to.be.false;
    });
  });

  describe("removeMin", () => {
    it("removes the minimum element from the queue", () => {
      pq.add("b", 2);
      pq.add("a", 1);
      pq.add("c", 3);
      pq.add("e", 5);
      pq.add("d", 4);
      expect(pq.removeMin()).to.equal("a");
      expect(pq.removeMin()).to.equal("b");
      expect(pq.removeMin()).to.equal("c");
      expect(pq.removeMin()).to.equal("d");
      expect(pq.removeMin()).to.equal("e");
    });

    it("throws an error if there is no element in the queue", () => {
      expect(() => { pq.removeMin(); }).to.throw();
    });
  });

  describe("decrease", () => {
    it("decreases the priority of a key", () => {
      pq.add("a", 1);
      pq.decrease("a", -1);
      expect(pq.priority("a")).to.equal(-1);
    });

    it("raises an error if the key is not in the queue", () => {
      expect(() => { pq.decrease("a", -1); }).to.throw();
    });

    it("raises an error if the new priority is greater than current", () => {
      pq.add("a", 1);
      expect(() => { pq.decrease("a", 2); }).to.throw();
    });
  });
});
