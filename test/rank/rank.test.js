import _ from 'lodash-es';
import { expect } from '@esm-bundle/chai';
import { Graph } from '../../index.js';
import rank from '../../src/layout/rank/index.js';

describe('rank', () => {
  const RANKERS = ['longest-path', 'tight-tree', 'network-simplex', 'unknown-should-still-work'];
  /** @type Graph */
  let g;

  beforeEach(() => {
    g = new Graph()
      .setGraph({})
      .setDefaultNodeLabel(() => ({}))
      .setDefaultEdgeLabel(() => ({ minLen: 1, weight: 1 }))
      .setPath(['a', 'b', 'c', 'd', 'h'])
      .setPath(['a', 'e', 'g', 'h'])
      .setPath(['a', 'f', 'g']);
  });

  _.forEach(RANKERS, (ranker) => {
    describe(ranker, () => {
      it('respects the minLen attribute', () => {
        g.graph().ranker = ranker;
        rank(g);
        _.forEach(g.edges(), (e) => {
          const vRank = g.node(e.v).rank;
          const wRank = g.node(e.w).rank;
          expect(wRank - vRank).to.be.gte(g.edge(e).minLen);
        });
      });

      it('can rank a single node graph', () => {
        const graph = new Graph().setGraph({ ranker }).setNode('a', {});
        rank(graph);
        expect(graph.node('a').rank).to.equal(0);
      });
    });
  });
});
