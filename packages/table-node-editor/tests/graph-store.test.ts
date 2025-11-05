import { GraphStore } from '../src/graph-store';

describe('GraphStore', () => {
  it('adds nodes and serializes graph definition', () => {
    const store = new GraphStore({ id: 'test-graph' });

    const source = store.addNode({ type: 'SourceNode', position: { x: 10, y: 20 }, config: { value: 1 } });
    const target = store.addNode({ type: 'TargetNode', position: { x: 300, y: 120 } });

    store.connect({ fromNodeId: (source as any).id, toNodeId: (target as any).id, fromPort: 'output', toPort: 'input' });

    const graph = store.toGraphDefinition() as any;

    expect(graph.id).toBe('test-graph');
    expect(graph.nodes).toHaveLength(2);
    const serializedSource = graph.nodes.find((node: any) => node.id === (source as any).id);
    expect(serializedSource?.next).toEqual([(target as any).id]);
    expect(graph.metadata?.layout?.[(source as any).id]).toEqual({ x: 10, y: 20 });
    expect(graph.metadata?.edges).toHaveLength(1);
  });

  it('removes edges and maintains next links', () => {
    const store = new GraphStore();
    const a = store.addNode({ type: 'A' });
    const b = store.addNode({ type: 'B' });

    const edge = store.connect({ fromNodeId: (a as any).id, toNodeId: (b as any).id });
    expect(store.listEdges()).toHaveLength(1);

    store.disconnect(edge.id);
    expect(store.listEdges()).toHaveLength(0);
    const serialized = store.toGraphDefinition() as any;
    const nodeA = serialized.nodes.find((node: any) => node.id === (a as any).id);
    expect(nodeA?.next).toBeUndefined();
  });

  it('loads existing graph with metadata', () => {
    const store = new GraphStore();
    store.loadGraph({
      id: 'loaded-graph',
      nodes: [
        { id: 'a', type: 'Alpha', next: ['b'], config: { name: 'first' } },
        { id: 'b', type: 'Beta' }
      ],
      metadata: {
        layout: {
          a: { x: 50, y: 60 },
          b: { x: 320, y: 200 }
        },
        edges: [
          { id: 'edge-custom', from: { nodeId: 'a', port: 'out' }, to: { nodeId: 'b', port: 'in' } }
        ]
      }
    });

    expect(store.listNodes()).toHaveLength(2);
    expect(store.listEdges()).toHaveLength(1);
    const graph = store.toGraphDefinition();
    expect(graph.metadata?.edges?.[0]?.id).toBe('edge-custom');
    expect(graph.metadata?.layout?.b).toEqual({ x: 320, y: 200 });
  });
});
