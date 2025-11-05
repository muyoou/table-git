import type { RuntimeNode } from './base-node';

export class NodeRegistry {
  private readonly nodes = new Map<string, RuntimeNode>();

  register(node: RuntimeNode): void {
    if (this.nodes.has(node.type)) {
      throw new Error(`Node '${node.type}' already registered.`);
    }
    this.nodes.set(node.type, node);
  }

  replace(node: RuntimeNode): void {
    this.nodes.set(node.type, node);
  }

  get(type: string): RuntimeNode {
    const node = this.nodes.get(type);
    if (!node) {
      throw new Error(`Node '${type}' is not registered.`);
    }
    return node;
  }

  list(): RuntimeNode[] {
    return [...this.nodes.values()];
  }

  clear(): void {
    this.nodes.clear();
  }
}
