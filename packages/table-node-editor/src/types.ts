import type { GraphDefinition, NodeInstance } from '@table-git/memory-engine';

export type PortDirection = 'input' | 'output';

export type EditorVariableType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export interface EditorVariableDefinition {
  id: string;
  name: string;
  type: EditorVariableType;
  defaultValue?: unknown;
}

export interface EditorVariableState extends EditorVariableDefinition {
  value?: unknown;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface PortReference {
  nodeId: string;
  port?: string;
  direction: PortDirection;
}

export interface Edge {
  id: string;
  from: PortReference;
  to: PortReference;
}

export interface EditorNode extends NodeInstance {
  position: NodePosition;
  config: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface GraphMetadata {
  layout?: Record<string, NodePosition>;
  edges?: EdgeMetadata[];
  variables?: EditorVariableDefinition[];
  [key: string]: unknown;
}

export interface EdgeMetadata {
  id: string;
  from: { nodeId: string; port?: string };
  to: { nodeId: string; port?: string };
}

export interface GraphDefinitionWithMetadata extends GraphDefinition {
  metadata?: GraphMetadata;
}
