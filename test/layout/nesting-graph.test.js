import { expect } from '@esm-bundle/chai';
import { Graph, algorithms } from '../../index.js';
import * as nestingGraph from '../../src/layout/nesting-graph.js';

const { components } = algorithms;

/** @typedef {import('../../src/layout/types').GraphLabel} GraphLabel */
/** @typedef {import('../../src/layout/types').NestedGraphNodeConfig} NestedGraphNodeConfig */
/** @typedef {import('../../src/layout/types').EdgeConfig} EdgeConfig */

describe('rank/nestingGraph', () => {
  /** @type Graph<GraphLabel, NestedGraphNodeConfig, EdgeConfig> */
  let g;

  beforeEach(() => {
    g = new Graph({ compound: true }).setGraph({}).setDefaultNodeLabel(() => ({}));
  });

  describe('run', () => {
    it('connects a disconnected graph', () => {
      g.setNode('a');
      g.setNode('b');
      expect(components(g)).to.have.length(2);
      nestingGraph.run(g);
      expect(components(g)).to.have.length(1);
      expect(g.hasNode('a'));
      expect(g.hasNode('b'));
    });

    it('adds border nodes to the top and bottom of a subgraph', () => {
      g.setParent('a', 'sg1');
      nestingGraph.run(g);

      const { borderTop } = g.node('sg1');
      const { borderBottom } = g.node('sg1');
      expect(borderTop).to.exist;
      expect(borderBottom).to.exist;
      expect(g.parent(borderTop)).to.equal('sg1');
      expect(g.parent(borderBottom)).to.equal('sg1');
      expect(g.outEdges(borderTop, 'a')).to.have.length(1);
      expect(g.edge(g.outEdges(borderTop, 'a')[0]).minLen).equals(1);
      expect(g.outEdges('a', borderBottom)).to.have.length(1);
      expect(g.edge(g.outEdges('a', borderBottom)[0]).minLen).equals(1);
      expect(g.node(borderTop)).eqls({ width: 0, height: 0, dummy: 'border' });
      expect(g.node(borderBottom)).eqls({ width: 0, height: 0, dummy: 'border' });
    });

    it('adds edges between borders of nested subgraphs', () => {
      g.setParent('sg2', 'sg1');
      g.setParent('a', 'sg2');
      nestingGraph.run(g);

      const sg1Top = g.node('sg1').borderTop;
      const sg1Bottom = g.node('sg1').borderBottom;
      const sg2Top = g.node('sg2').borderTop;
      const sg2Bottom = g.node('sg2').borderBottom;
      expect(sg1Top).to.exist;
      expect(sg1Bottom).to.exist;
      expect(sg2Top).to.exist;
      expect(sg2Bottom).to.exist;
      expect(g.outEdges(sg1Top, sg2Top)).to.have.length(1);
      expect(g.edge(g.outEdges(sg1Top, sg2Top)[0]).minLen).equals(1);
      expect(g.outEdges(sg2Bottom, sg1Bottom)).to.have.length(1);
      expect(g.edge(g.outEdges(sg2Bottom, sg1Bottom)[0]).minLen).equals(1);
    });

    it('adds sufficient weight to border to node edges', () => {
      // We want to keep subgraphs tight, so we should ensure that the weight for
      // the edge between the top (and bottom) border nodes and nodes in the
      // subgraph have weights exceeding anything in the graph.
      g.setParent('x', 'sg');
      g.setEdge('a', 'x', { weight: 100 });
      g.setEdge('x', 'b', { weight: 200 });
      nestingGraph.run(g);

      const top = g.node('sg').borderTop;
      const bot = g.node('sg').borderBottom;
      expect(g.edge(top, 'x').weight).to.be.gt(300);
      expect(g.edge('x', bot).weight).to.be.gt(300);
    });

    it('adds an edge from the root to the tops of top-level subgraphs', () => {
      g.setParent('a', 'sg1');
      nestingGraph.run(g);

      const root = g.graph().nestingRoot;
      const { borderTop } = g.node('sg1');
      expect(root).to.exist;
      expect(borderTop).to.exist;
      expect(g.outEdges(root, borderTop)).to.have.length(1);
      expect(g.hasEdge(g.outEdges(root, borderTop)[0])).to.be.true;
    });

    it('adds an edge from root to each node with the correct minLen #1', () => {
      g.setNode('a');
      nestingGraph.run(g);

      const root = g.graph().nestingRoot;
      expect(root).to.exist;
      expect(g.outEdges(root, 'a')).to.have.length(1);
      expect(g.edge(g.outEdges(root, 'a')[0])).eqls({ weight: 0, minLen: 1 });
    });

    it('adds an edge from root to each node with the correct minLen #2', () => {
      g.setParent('a', 'sg1');
      nestingGraph.run(g);

      const root = g.graph().nestingRoot;
      expect(root).to.exist;
      expect(g.outEdges(root, 'a')).to.have.length(1);
      expect(g.edge(g.outEdges(root, 'a')[0])).eqls({ weight: 0, minLen: 3 });
    });

    it('adds an edge from root to each node with the correct minLen #3', () => {
      g.setParent('sg2', 'sg1');
      g.setParent('a', 'sg2');
      nestingGraph.run(g);

      const root = g.graph().nestingRoot;
      expect(root).to.exist;
      expect(g.outEdges(root, 'a')).to.have.length(1);
      expect(g.edge(g.outEdges(root, 'a')[0])).eqls({ weight: 0, minLen: 5 });
    });

    it('does not add an edge from the root to itself', () => {
      g.setNode('a');
      nestingGraph.run(g);

      const root = g.graph().nestingRoot;
      expect(g.outEdges(root, root)).eqls([]);
    });

    it('expands inter-node edges to separate SG border and nodes #1', () => {
      g.setEdge('a', 'b', { minLen: 1 });
      nestingGraph.run(g);
      expect(g.edge('a', 'b').minLen).equals(1);
    });

    it('expands inter-node edges to separate SG border and nodes #2', () => {
      g.setParent('a', 'sg1');
      g.setEdge('a', 'b', { minLen: 1 });
      nestingGraph.run(g);
      expect(g.edge('a', 'b').minLen).equals(3);
    });

    it('expands inter-node edges to separate SG border and nodes #3', () => {
      g.setParent('sg2', 'sg1');
      g.setParent('a', 'sg2');
      g.setEdge('a', 'b', { minLen: 1 });
      nestingGraph.run(g);
      expect(g.edge('a', 'b').minLen).equals(5);
    });

    it('sets minLen correctly for nested SG boder to children', () => {
      g.setParent('a', 'sg1');
      g.setParent('sg2', 'sg1');
      g.setParent('b', 'sg2');
      nestingGraph.run(g);

      // We expect the following layering:
      //
      // 0: root
      // 1: empty (close sg2)
      // 2: empty (close sg1)
      // 3: open sg1
      // 4: open sg2
      // 5: a, b
      // 6: close sg2
      // 7: close sg1

      const root = g.graph().nestingRoot;
      const sg1Top = g.node('sg1').borderTop;
      const sg1Bot = g.node('sg1').borderBottom;
      const sg2Top = g.node('sg2').borderTop;
      const sg2Bot = g.node('sg2').borderBottom;

      expect(g.edge(root, sg1Top).minLen).equals(3);
      expect(g.edge(sg1Top, sg2Top).minLen).equals(1);
      expect(g.edge(sg1Top, 'a').minLen).equals(2);
      expect(g.edge('a', sg1Bot).minLen).equals(2);
      expect(g.edge(sg2Top, 'b').minLen).equals(1);
      expect(g.edge('b', sg2Bot).minLen).equals(1);
      expect(g.edge(sg2Bot, sg1Bot).minLen).equals(1);
    });
  });

  describe('cleanup', () => {
    it('removes nesting graph edges', () => {
      g.setParent('a', 'sg1');
      g.setEdge('a', 'b', { minLen: 1 });
      nestingGraph.run(g);
      nestingGraph.cleanup(g);
      expect(g.successors('a')).eqls(['b']);
    });

    it('removes the root node', () => {
      g.setParent('a', 'sg1');
      nestingGraph.run(g);
      nestingGraph.cleanup(g);
      expect(g.nodeCount()).to.equal(4); // sg1 + sg1Top + sg1Bottom + "a"
    });
  });
});
