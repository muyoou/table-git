import type { GraphDefinition, NodeInstance } from './graph-types';

export interface UseNodeOptions {
  id?: string;
  connectFrom?: string[];
  metadata?: Record<string, unknown>;
}

export class FlowBuilder {
  private readonly graphId: string;
  private readonly label?: string;
  private readonly description?: string;
  private lastNodeId?: string;
  private readonly nodes = new Map<string, NodeInstance>();
  private readonly nodeMetadata = new Map<string, Record<string, unknown>>();

  private constructor(graphId: string, label?: string, description?: string) {
    this.graphId = graphId;
    this.label = label;
    this.description = description;
  }

  static create(graphId = 'memory-flow', label?: string, description?: string): FlowBuilder {
    return new FlowBuilder(graphId, label, description);
  }

  useNode(type: string, config: Record<string, unknown> = {}, options: UseNodeOptions = {}): FlowBuilder {
    const nodeId = options.id ?? this.generateNodeId(type);
    if (this.nodes.has(nodeId)) {
      throw new Error(`Node id '${nodeId}' already exists.`);
    }

    const node: NodeInstance = {
      id: nodeId,
      type,
      config,
      next: []
    };

    this.nodes.set(nodeId, node);

    if (options.metadata) {
      this.nodeMetadata.set(nodeId, options.metadata);
    }

    const connectFrom = options.connectFrom ?? (this.lastNodeId ? [this.lastNodeId] : []);
    for (const sourceId of connectFrom) {
      this.link(sourceId, nodeId);
    }

    this.lastNodeId = nodeId;
    return this;
  }

  link(fromId: string, toId: string): FlowBuilder {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);
    if (!fromNode) {
      throw new Error(`Cannot link from '${fromId}' because it does not exist.`);
    }
    if (!toNode) {
      throw new Error(`Cannot link to '${toId}' because it does not exist.`);
    }
    if (!fromNode.next) {
      fromNode.next = [];
    }
    if (!fromNode.next.includes(toId)) {
      fromNode.next.push(toId);
    }
    return this;
  }

  metadata(nodeId: string, metadata: Record<string, unknown>): FlowBuilder {
    if (!this.nodes.has(nodeId)) {
      throw new Error(`Cannot apply metadata to missing node '${nodeId}'.`);
    }
    this.nodeMetadata.set(nodeId, { ...(this.nodeMetadata.get(nodeId) ?? {}), ...metadata });
    return this;
  }

  build(): GraphDefinition {
    const nodes: NodeInstance[] = [...this.nodes.values()].map(node => ({
      ...node,
      next: node.next && node.next.length ? [...node.next] : undefined,
      config: node.config && Object.keys(node.config).length ? { ...node.config } : undefined
    }));

    return {
      id: this.graphId,
      label: this.label,
      description: this.description,
      nodes,
      metadata: nodes.reduce<Record<string, unknown>>((acc, node) => {
        const data = this.nodeMetadata.get(node.id);
        if (data) {
          acc[node.id] = data;
        }
        return acc;
      }, {})
    };
  }

  private generateNodeId(type: string): string {
    const base = type.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase() || 'node';
    let suffix = 1;
    let candidate = `${base}-${suffix}`;
    while (this.nodes.has(candidate)) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    return candidate;
  }
}
