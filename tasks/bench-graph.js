#!/usr/bin/env node
/* eslint-disable func-names */

import Benchmark from "benchmark";
import seedrandom from "seedrandom";
import pkg from 'sprintf';
import { Graph, algorithms } from '../index.js';

const { sprintf } = pkg;

const seed = process.env.SEED;
seedrandom(seed, { global: true });
if (seed) {
  console.log("SEED: %s (%d)", seed, Math.random());
}

const NODE_SIZES = [100];
const EDGE_DENSITY = 0.2;
const KEY_SIZE = 10;

function runBenchmark(name, fn) {
  const options = {};
  options.onComplete = function(bench) {
    const {target} = bench;
        const {hz} = target;
        const {stats} = target;
        const {rme} = stats;
        const samples = stats.sample.length;
        const msg = sprintf("    %25s: %13s ops/sec \xb1 %s%% (%3d run(s) sampled)",
                      target.name,
                      Benchmark.formatNumber(hz.toFixed(2)),
                      rme.toFixed(2),
                      samples);
    console.log(msg);
  };

  options.onError = (bench) => {
    console.error(`${bench.target.error}`);
  };

  options.setup = function() {
    this.count = Math.random() * 1000;
    this.nextInt = function(range) {
      return Math.floor(this.count++ % range );
    };
  };
  
  new Benchmark(name, fn, options).run();
}

function keys(count) {
  const ks = [];
      let k;
  for (let i = 0; i < count; ++i) {
    k = "";
    for (let j = 0; j < KEY_SIZE; ++j) {
      k += String.fromCharCode(97 + Math.floor(Math.random() * 26));
    }
    ks.push(k);
  }
  return ks;
}

function buildGraph(numNodes, edgeDensity) {
  const g = new Graph();
      const numEdges = numNodes * numNodes * edgeDensity;
      const ks = keys(numNodes);

  ks.forEach((k) => { g.setNode(k); });

  for (let i = 0; i < numEdges; ++i) {
    let v; 
    let w;
    do {
      v = ks[Math.floor(Math.random() * ks.length)];
      w = ks[Math.floor(Math.random() * ks.length)];
    } while (g.hasEdge(v, w));
    g.setEdge(v, w);
  }
  return g;
}

NODE_SIZES.forEach((size) => {
  const g = buildGraph(size, EDGE_DENSITY);
  const nodes = g.nodes();
  const edges = g.edges();
  const nameSuffix = `(${size},${EDGE_DENSITY})`;

  runBenchmark(`nodes${  nameSuffix}`, () => {
    g.nodes();
  });

  runBenchmark(`sources${  nameSuffix}`, () => {
    g.sources();
  });

  runBenchmark(`sinks${  nameSuffix}`, () => {
    g.sinks();
  });

  runBenchmark(`filterNodes all${  nameSuffix}`, () => {
    g.filterNodes(() => true);
  });

  runBenchmark(`filterNodes none${  nameSuffix}`, () => {
    g.filterNodes(() => false);
  });

  runBenchmark(`setNode${  nameSuffix}`, () => {
    g.setNode("key", "label");
  });

  runBenchmark(`node${nameSuffix}`, function() {
    g.node(nodes[this.nextInt(nodes.length)]);
  });

  runBenchmark(`set + removeNode${nameSuffix}`, () => {
    g.setNode("key");
    g.removeNode("key");
  });

  runBenchmark(`predecessors${  nameSuffix}`, function() {
    g.predecessors(nodes[this.nextInt(nodes.length)]);
  });

  runBenchmark(`successors${  nameSuffix}`, function() {
    g.successors(nodes[this.nextInt(nodes.length)]);
  });

  runBenchmark(`neighbors${  nameSuffix}`, function() {
    g.neighbors(nodes[this.nextInt(nodes.length)]);
  });

  runBenchmark(`edges${  nameSuffix}`, () => {
    g.edges();
  });

  runBenchmark(`setPath${  nameSuffix}`, () => {
    g.setPath(["a", "b", "c", "d", "e"]);
  });

  runBenchmark(`setEdge${  nameSuffix}`, () => {
    g.setEdge("from", "to", "label");
  });

  runBenchmark(`edge${  nameSuffix}`, function() {
    const edge = edges[this.nextInt(edges.length)];
    g.edge(edge);
  });

  runBenchmark(`set + removeEdge${  nameSuffix}`, () => {
    g.setEdge("from", "to");
    g.removeEdge("from", "to");
  });

  runBenchmark(`inEdges${  nameSuffix}`, function() {
    g.inEdges(nodes[this.nextInt(nodes.length)]);
  });

  runBenchmark(`outEdges${  nameSuffix}`, function() {
    g.outEdges(nodes[this.nextInt(nodes.length)]);
  });

  runBenchmark(`nodeEdges${  nameSuffix}`, function() {
    g.nodeEdges(nodes[this.nextInt(nodes.length)]);
  });

  runBenchmark(`components${  nameSuffix}`, () => {
    algorithms.components(g);
  });

  runBenchmark(`dijkstraAll${  nameSuffix}`, () => {
    algorithms.dijkstraAll(g);
  });
});
