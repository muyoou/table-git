export interface PortDefinition {
  name: string;
  label?: string;
  type?: string;
  description?: string;
  required?: boolean;
}

export interface GraphPortReference {
  nodeId: string;
  port?: string;
}

export interface GraphEdgeMetadata {
  id?: string;
  from: GraphPortReference;
  to: GraphPortReference;
}

export interface GraphMetadata {
  edges?: GraphEdgeMetadata[];
  [key: string]: unknown;
}

export interface NodeSchema {
  type: string;
  label?: string;
  summary?: string;
  category?: string;
  inputs?: PortDefinition[];
  outputs?: PortDefinition[];
  configSchema?: Record<string, unknown>;
  uiHints?: Record<string, unknown>;
}

export interface NodeInstance {
  id: string;
  type: string;
  config?: Record<string, unknown>;
  next?: string[];
}

export interface GraphDefinition {
  id: string;
  label?: string;
  description?: string;
  nodes: NodeInstance[];
  metadata?: GraphMetadata;
}
