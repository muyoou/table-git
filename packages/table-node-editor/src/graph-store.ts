import type {
  GraphDefinitionWithMetadata,
  EditorNode,
  Edge,
  EdgeMetadata,
  GraphMetadata,
  NodePosition,
  EditorVariableDefinition,
  EditorVariableState,
  EditorVariableType
} from './types';
import { EventEmitter } from './utils/event-emitter';

export interface GraphStoreOptions {
  id?: string;
  label?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface AddNodeOptions {
  id?: string;
  type: string;
  config?: Record<string, unknown>;
  position?: NodePosition;
  metadata?: Record<string, unknown>;
}

export interface UpdateNodeConfigOptions {
  merge?: boolean;
}

export interface ConnectNodesOptions {
  fromNodeId: string;
  toNodeId: string;
  fromPort?: string;
  toPort?: string;
}

interface GraphStoreEvents extends Record<string, unknown> {
  nodeAdded: EditorNode;
  nodeUpdated: EditorNode;
  nodeMoved: EditorNode;
  nodeRemoved: { nodeId: string };
  edgeAdded: Edge;
  edgeRemoved: Edge;
  graphChanged: GraphDefinitionWithMetadata;
  variablesChanged: EditorVariableState[];
}

const DEFAULT_NODE_POSITION: NodePosition = { x: 100, y: 100 };
const DEFAULT_GRAPH_ID = 'editor-graph';

export interface AddVariableOptions {
  id?: string;
  name: string;
  type: EditorVariableType;
  defaultValue?: unknown;
}

export interface UpdateVariableOptions {
  name?: string;
  type?: EditorVariableType;
  defaultValue?: unknown;
}

export class GraphStore extends EventEmitter<GraphStoreEvents> {
  private readonly nodes = new Map<string, EditorNode>();
  private readonly edges = new Map<string, Edge>();
  private graphId: string;
  private label?: string;
  private description?: string;
  private customMetadata: Record<string, unknown>;
  private nodeIdCounter = 0;
  private edgeIdCounter = 0;
  private readonly variables = new Map<string, EditorVariableState>();
  private variableIdCounter = 0;

  constructor(options: GraphStoreOptions = {}) {
    super();
    this.graphId = options.id ?? DEFAULT_GRAPH_ID;
    this.label = options.label;
    this.description = options.description;
    this.customMetadata = { ...(options.metadata ?? {}) };
  }

  getGraphInfo(): { id: string; label?: string; description?: string } {
    return {
      id: this.graphId,
      label: this.label,
      description: this.description
    };
  }

  setGraphInfo(info: { id?: string; label?: string; description?: string }): void {
    if (info.id) {
      this.graphId = info.id;
    }
    if (typeof info.label !== 'undefined') {
      this.label = info.label;
    }
    if (typeof info.description !== 'undefined') {
      this.description = info.description;
    }
    this.emitGraphChanged();
  }

  listNodes(): EditorNode[] {
    return [...this.nodes.values()].map(node => ({ ...node, config: { ...node.config }, next: node.next ? [...node.next] : undefined }));
  }

  getNode(nodeId: string): EditorNode | undefined {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return undefined;
    }
    return { ...node, config: { ...node.config }, next: node.next ? [...node.next] : undefined };
  }

  listEdges(): Edge[] {
    return [...this.edges.values()].map(edge => ({
      ...edge,
      from: { ...edge.from },
      to: { ...edge.to }
    }));
  }

  getEdge(edgeId: string): Edge | undefined {
    const edge = this.edges.get(edgeId);
    if (!edge) {
      return undefined;
    }
    return {
      ...edge,
      from: { ...edge.from },
      to: { ...edge.to }
    };
  }

  addNode(input: AddNodeOptions): EditorNode {
    const nodeId = input.id ?? this.generateNodeId(input.type);
    if (this.nodes.has(nodeId)) {
      throw new Error(`Node '${nodeId}' already exists.`);
    }

    const node: EditorNode = {
      id: nodeId,
      type: input.type,
      config: { ...(input.config ?? {}) },
      position: input.position ?? { ...DEFAULT_NODE_POSITION },
      metadata: input.metadata ? { ...input.metadata } : undefined,
      next: []
    };

    this.nodes.set(nodeId, node);
    this.emit('nodeAdded', this.cloneNode(node));
    this.emitGraphChanged();
    return this.cloneNode(node);
  }

  updateNodeConfig(nodeId: string, config: Record<string, unknown>, options: UpdateNodeConfigOptions = {}): EditorNode {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Cannot update missing node '${nodeId}'.`);
    }

    node.config = options.merge ? { ...node.config, ...config } : { ...config };
    this.emit('nodeUpdated', this.cloneNode(node));
    this.emitGraphChanged();
    return this.cloneNode(node);
  }

  moveNode(nodeId: string, position: NodePosition): EditorNode {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Cannot move missing node '${nodeId}'.`);
    }
    node.position = { ...position };
    this.emit('nodeMoved', this.cloneNode(node));
    this.emitGraphChanged();
    return this.cloneNode(node);
  }

  removeNode(nodeId: string): void {
    if (!this.nodes.has(nodeId)) {
      return;
    }

    for (const edge of [...this.edges.values()]) {
      if (edge.from.nodeId === nodeId || edge.to.nodeId === nodeId) {
        this.removeEdge(edge.id);
      }
    }

    this.nodes.delete(nodeId);
    this.emit('nodeRemoved', { nodeId });
    this.emitGraphChanged();
  }

  connect(options: ConnectNodesOptions): Edge {
    const from = this.nodes.get(options.fromNodeId);
    const to = this.nodes.get(options.toNodeId);
    if (!from) {
      throw new Error(`Cannot connect from missing node '${options.fromNodeId}'.`);
    }
    if (!to) {
      throw new Error(`Cannot connect to missing node '${options.toNodeId}'.`);
    }

    const existing = [...this.edges.values()].find(edge =>
      edge.from.nodeId === options.fromNodeId &&
      edge.to.nodeId === options.toNodeId &&
      edge.from.port === options.fromPort &&
      edge.to.port === options.toPort
    );

    if (existing) {
      return this.cloneEdge(existing);
    }

    const edgeId = this.generateEdgeId();
    const edge: Edge = {
      id: edgeId,
      from: { nodeId: options.fromNodeId, port: options.fromPort, direction: 'output' },
      to: { nodeId: options.toNodeId, port: options.toPort, direction: 'input' }
    };

    this.edges.set(edgeId, edge);
    this.ensureNextLink(options.fromNodeId, options.toNodeId);
    this.emit('edgeAdded', this.cloneEdge(edge));
    this.emitGraphChanged();
    return this.cloneEdge(edge);
  }

  disconnect(edgeId: string): void {
    this.removeEdge(edgeId);
  }

  clear(): void {
    if (!this.nodes.size && !this.edges.size && !this.variables.size) {
      return;
    }
    const nodeIds = [...this.nodes.keys()];
    const edges = [...this.edges.values()].map(edge => this.cloneEdge(edge));
    const hadVariables = this.variables.size > 0;
    this.nodes.clear();
    this.edges.clear();
    this.variables.clear();

    for (const edge of edges) {
      this.emit('edgeRemoved', edge);
    }
    for (const nodeId of nodeIds) {
      this.emit('nodeRemoved', { nodeId });
    }

    if (hadVariables) {
      this.emitVariablesChanged();
    }

    this.emitGraphChanged();
  }

  setMetadata(metadata: Record<string, unknown>): void {
    const { variables: _variables, ...rest } = metadata ?? {};
    this.customMetadata = { ...rest };
    this.emitGraphChanged();
  }

  getMetadata(): Record<string, unknown> {
    return { ...this.customMetadata };
  }

  listVariables(): EditorVariableState[] {
    return [...this.variables.values()].map(variable => this.cloneVariable(variable));
  }

  getVariable(id: string): EditorVariableState | undefined {
    const variable = this.variables.get(id);
    return variable ? this.cloneVariable(variable) : undefined;
  }

  addVariable(options: AddVariableOptions): EditorVariableState {
    this.ensureVariableNameValid(options.name);
    this.ensureVariableNameUnique(options.name);

    const id = options.id ? String(options.id) : this.generateVariableId(options.name);
    if (this.variables.has(id)) {
      throw new Error(`Variable '${id}' already exists.`);
    }

    const defaultValue = this.coerceVariableValue(options.type, options.defaultValue, '变量默认值');

    const variable: EditorVariableState = {
      id,
      name: options.name,
      type: options.type,
      defaultValue: this.cloneValue(defaultValue),
      value: this.cloneValue(defaultValue)
    };

    this.variables.set(id, variable);
    this.updateVariableCounterFromId(id);
    this.emitVariablesChanged();
    this.emitGraphChanged();
    return this.cloneVariable(variable);
  }

  updateVariable(id: string, updates: UpdateVariableOptions): EditorVariableState {
    const existing = this.variables.get(id);
    if (!existing) {
      throw new Error(`Variable '${id}' does not exist.`);
    }

    const nextName = typeof updates.name === 'string' ? updates.name : existing.name;
    this.ensureVariableNameValid(nextName);
    this.ensureVariableNameUnique(nextName, id);

    const nextType = updates.type ?? existing.type;

    const nextDefaultRaw = Object.prototype.hasOwnProperty.call(updates, 'defaultValue')
      ? updates.defaultValue
      : existing.defaultValue;
    const nextDefault = this.coerceVariableValue(nextType, nextDefaultRaw, '变量默认值');
    const nextValueRaw = existing.value;
    const nextValue = this.coerceVariableValue(nextType, Object.prototype.hasOwnProperty.call(updates, 'defaultValue') ? nextDefaultRaw : nextValueRaw, '变量值');

    existing.name = nextName;
    existing.type = nextType;
    existing.defaultValue = this.cloneValue(nextDefault);
    existing.value = this.cloneValue(nextValue);

    this.emitVariablesChanged();
    this.emitGraphChanged();
    return this.cloneVariable(existing);
  }

  removeVariable(id: string): void {
    if (!this.variables.delete(id)) {
      return;
    }
    this.emitVariablesChanged();
    this.emitGraphChanged();
  }

  setVariableValue(id: string, value: unknown): EditorVariableState {
    const existing = this.variables.get(id);
    if (!existing) {
      throw new Error(`Variable '${id}' does not exist.`);
    }

    const coerced = this.coerceVariableValue(existing.type, value, '变量值');
    existing.value = this.cloneValue(coerced);
    this.emitVariablesChanged();
    return this.cloneVariable(existing);
  }

  resetVariableValues(): void {
    let changed = false;
    for (const variable of this.variables.values()) {
      const snapshot = this.cloneValue(variable.defaultValue);
      if (!this.areValuesEqual(variable.value, snapshot)) {
        variable.value = snapshot;
        changed = true;
      }
    }
    if (changed) {
      this.emitVariablesChanged();
    }
  }

  applyRuntimeVariableValues(values: Record<string, unknown>): void {
    if (!values || typeof values !== 'object') {
      return;
    }
    let changed = false;
    for (const variable of this.variables.values()) {
      const incoming = Object.prototype.hasOwnProperty.call(values, variable.name)
        ? values[variable.name]
        : variable.value;
      const coerced = this.coerceVariableValue(variable.type, incoming, '变量值');
      if (!this.areValuesEqual(variable.value, coerced)) {
        variable.value = this.cloneValue(coerced);
        changed = true;
      }
    }
    if (changed) {
      this.emitVariablesChanged();
    }
  }

  getVariableValueMap(): Record<string, unknown> {
    const entries: Record<string, unknown> = {};
    for (const variable of this.variables.values()) {
      entries[variable.name] = this.cloneValue(
        typeof variable.value === 'undefined' ? variable.defaultValue : variable.value
      );
    }
    return entries;
  }

  toGraphDefinition(): GraphDefinitionWithMetadata {
    const nodes = [...this.nodes.values()].map(node => ({
      id: node.id,
      type: node.type,
      config: Object.keys(node.config ?? {}).length ? { ...node.config } : undefined,
      next: node.next && node.next.length ? [...node.next] : undefined
    }));

    const metadata: GraphMetadata = {
      ...(this.customMetadata ?? {}),
      layout: this.serializeLayout(),
      edges: this.serializeEdges()
    };

    const serializedVariables = this.serializeVariables();
    if (serializedVariables.length) {
      metadata.variables = serializedVariables;
    }

    return {
      id: this.graphId,
      label: this.label,
      description: this.description,
      nodes,
      metadata
    };
  }

  loadGraph(definition: GraphDefinitionWithMetadata): void {
    this.clear();
    this.graphId = definition.id;
    this.label = definition.label;
    this.description = definition.description;
    this.nodeIdCounter = 0;
    this.edgeIdCounter = 0;

  const metadata = definition.metadata ?? {};
  const { layout, edges: edgeMetadata, variables: variableDefs, ...rest } = metadata;
  this.customMetadata = { ...rest };
  this.variables.clear();
  this.applyLoadedVariables(Array.isArray(variableDefs) ? variableDefs : []);

    const layoutMap = layout ?? {};

    for (const nodeDef of definition.nodes) {
      const position = layoutMap[nodeDef.id] ?? DEFAULT_NODE_POSITION;
      const node: EditorNode = {
        id: nodeDef.id,
        type: nodeDef.type,
        config: { ...(nodeDef.config ?? {}) },
        position: { ...position },
        metadata: undefined,
        next: [...(nodeDef.next ?? [])]
      };
      this.nodes.set(node.id, node);
      this.emit('nodeAdded', this.cloneNode(node));
    }

    if (edgeMetadata && edgeMetadata.length) {
      for (const edgeMeta of edgeMetadata) {
        if (!edgeMeta.from || !edgeMeta.to) {
          continue;
        }
        if (!this.nodes.has(edgeMeta.from.nodeId) || !this.nodes.has(edgeMeta.to.nodeId)) {
          continue;
        }
        const edge: Edge = {
          id: edgeMeta.id ?? this.generateEdgeId(),
          from: { nodeId: edgeMeta.from.nodeId, port: edgeMeta.from.port, direction: 'output' },
          to: { nodeId: edgeMeta.to.nodeId, port: edgeMeta.to.port, direction: 'input' }
        };
        this.edges.set(edge.id, edge);
        this.ensureNextLink(edge.from.nodeId, edge.to.nodeId);
        this.emit('edgeAdded', this.cloneEdge(edge));
      }
    } else {
      for (const node of this.nodes.values()) {
        for (const nextId of node.next ?? []) {
          if (!this.nodes.has(nextId)) {
            continue;
          }
          const edge: Edge = {
            id: this.generateEdgeId(),
            from: { nodeId: node.id, direction: 'output' },
            to: { nodeId: nextId, direction: 'input' }
          };
          this.edges.set(edge.id, edge);
          this.emit('edgeAdded', this.cloneEdge(edge));
        }
      }
    }

    this.emitGraphChanged();
  }

  private ensureNextLink(fromId: string, toId: string): void {
    const from = this.nodes.get(fromId);
    if (!from) {
      return;
    }
    const nextSet = new Set(from.next ?? []);
    nextSet.add(toId);
    from.next = [...nextSet];
  }

  private removeEdge(edgeId: string): void {
    const edge = this.edges.get(edgeId);
    if (!edge) {
      return;
    }
    const clonedEdge = this.cloneEdge(edge);
    this.edges.delete(edgeId);

    const fromNode = this.nodes.get(edge.from.nodeId);
    if (fromNode && fromNode.next) {
      const remainingEdges = [...this.edges.values()].some(other => other.from.nodeId === edge.from.nodeId && other.to.nodeId === edge.to.nodeId);
      if (!remainingEdges) {
        fromNode.next = fromNode.next.filter(id => id !== edge.to.nodeId);
        if (!fromNode.next.length) {
          delete fromNode.next;
        }
      }
    }

    this.emit('edgeRemoved', clonedEdge);
    this.emitGraphChanged();
  }

  private serializeLayout(): Record<string, NodePosition> {
    const layout: Record<string, NodePosition> = {};
    for (const node of this.nodes.values()) {
      layout[node.id] = { ...node.position };
    }
    return layout;
  }

  private serializeEdges(): EdgeMetadata[] {
    const serialized: EdgeMetadata[] = [];
    for (const edge of this.edges.values()) {
      serialized.push({
        id: edge.id,
        from: { nodeId: edge.from.nodeId, port: edge.from.port },
        to: { nodeId: edge.to.nodeId, port: edge.to.port }
      });
    }
    return serialized;
  }

  private generateNodeId(type: string): string {
    this.nodeIdCounter += 1;
    const base = type.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase() || 'node';
    let candidate = `${base}-${this.nodeIdCounter}`;
    while (this.nodes.has(candidate)) {
      this.nodeIdCounter += 1;
      candidate = `${base}-${this.nodeIdCounter}`;
    }
    return candidate;
  }

  private generateEdgeId(): string {
    this.edgeIdCounter += 1;
    let candidate = `edge-${this.edgeIdCounter}`;
    while (this.edges.has(candidate)) {
      this.edgeIdCounter += 1;
      candidate = `edge-${this.edgeIdCounter}`;
    }
    return candidate;
  }

  private cloneNode(node: EditorNode): EditorNode {
    return {
      id: node.id,
      type: node.type,
      config: { ...node.config },
      position: { ...node.position },
      metadata: node.metadata ? { ...node.metadata } : undefined,
      next: node.next ? [...node.next] : undefined
    };
  }

  private cloneEdge(edge: Edge): Edge {
    return {
      id: edge.id,
      from: { ...edge.from },
      to: { ...edge.to }
    };
  }

  private serializeVariables(): EditorVariableDefinition[] {
    return [...this.variables.values()].map(variable => ({
      id: variable.id,
      name: variable.name,
      type: variable.type,
      defaultValue: this.cloneValue(variable.defaultValue)
    }));
  }

  private applyLoadedVariables(definitions: EditorVariableDefinition[]): void {
    this.variables.clear();
    const seenNames = new Set<string>();

    for (const definition of definitions) {
      if (!definition || typeof definition !== 'object') {
        continue;
      }
      const name = typeof definition.name === 'string' ? definition.name : `var${this.variables.size + 1}`;
      this.ensureVariableNameValid(name);
      if (seenNames.has(name)) {
        throw new Error(`变量名称“${name}”在图元数据中重复。`);
      }
      seenNames.add(name);

      const type = this.normalizeVariableType(definition.type);
      const defaultValue = this.coerceVariableValue(type, definition.defaultValue, '变量默认值');
      const idCandidate = definition.id ? String(definition.id) : this.generateVariableId(name);
      if (this.variables.has(idCandidate)) {
        throw new Error(`变量标识“${idCandidate}”在图元数据中重复。`);
      }

      const variable: EditorVariableState = {
        id: idCandidate,
        name,
        type,
        defaultValue: this.cloneValue(defaultValue),
        value: this.cloneValue(defaultValue)
      };

      this.variables.set(idCandidate, variable);
      this.updateVariableCounterFromId(idCandidate);
    }

    this.emitVariablesChanged();
  }

  private cloneVariable(variable: EditorVariableState): EditorVariableState {
    return {
      id: variable.id,
      name: variable.name,
      type: variable.type,
      defaultValue: this.cloneValue(variable.defaultValue),
      value: this.cloneValue(variable.value)
    };
  }

  private cloneValue<T>(value: T): T {
    if (Array.isArray(value)) {
      return value.map(item => this.cloneValue(item)) as unknown as T;
    }
    if (value && typeof value === 'object') {
      const source = value as Record<string, unknown>;
      const duplicated: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(source)) {
        duplicated[key] = this.cloneValue(item);
      }
      return duplicated as unknown as T;
    }
    return value;
  }

  private ensureVariableNameValid(name: string): void {
    if (typeof name !== 'string' || !name.trim()) {
      throw new Error('变量名称不能为空。');
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      throw new Error('变量名称必须以字母或下划线开头，并且仅包含字母、数字或下划线。');
    }
  }

  private ensureVariableNameUnique(name: string, ignoreId?: string): void {
    for (const variable of this.variables.values()) {
      if (variable.name === name && variable.id !== ignoreId) {
        throw new Error(`变量名称“${name}”已存在。`);
      }
    }
  }

  private generateVariableId(name: string): string {
    const normalized = name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'var';
    this.variableIdCounter += 1;
    let candidate = `${normalized}-${this.variableIdCounter}`;
    while (this.variables.has(candidate)) {
      this.variableIdCounter += 1;
      candidate = `${normalized}-${this.variableIdCounter}`;
    }
    return candidate;
  }

  private updateVariableCounterFromId(id: string): void {
    const match = /-(\d+)$/.exec(id);
    if (!match) {
      return;
    }
    const numeric = Number(match[1]);
    if (Number.isFinite(numeric) && numeric > this.variableIdCounter) {
      this.variableIdCounter = numeric;
    }
  }

  private normalizeVariableType(type: unknown): EditorVariableType {
    const allowed: EditorVariableType[] = ['string', 'number', 'boolean', 'array', 'object'];
    if (typeof type === 'string' && allowed.includes(type as EditorVariableType)) {
      return type as EditorVariableType;
    }
    return 'string';
  }

  private coerceVariableValue(type: EditorVariableType, raw: unknown, label: string): unknown {
    if (typeof raw === 'undefined') {
      return undefined;
    }
    if (raw === null) {
      throw new Error(`${label} 不能为 null。`);
    }

    switch (type) {
      case 'string': {
        if (typeof raw === 'string') {
          return raw;
        }
        if (typeof raw === 'number' || typeof raw === 'boolean') {
          return String(raw);
        }
        throw new Error(`${label} 需要是字符串。`);
      }
      case 'number': {
        if (typeof raw === 'number') {
          if (!Number.isFinite(raw)) {
            throw new Error(`${label} 必须为有限数值。`);
          }
          return raw;
        }
        if (typeof raw === 'string') {
          const trimmed = raw.trim();
          if (!trimmed) {
            return undefined;
          }
          const parsed = Number(trimmed);
          if (!Number.isFinite(parsed)) {
            throw new Error(`${label} 必须为合法的数值。`);
          }
          return parsed;
        }
        if (typeof raw === 'boolean') {
          return raw ? 1 : 0;
        }
        throw new Error(`${label} 必须为数值。`);
      }
      case 'boolean': {
        if (typeof raw === 'boolean') {
          return raw;
        }
        if (typeof raw === 'number') {
          if (raw === 1) {
            return true;
          }
          if (raw === 0) {
            return false;
          }
        }
        if (typeof raw === 'string') {
          const normalized = raw.trim().toLowerCase();
          if (!normalized) {
            return undefined;
          }
          if (['true', '1', 'yes', 'on'].includes(normalized)) {
            return true;
          }
          if (['false', '0', 'no', 'off'].includes(normalized)) {
            return false;
          }
        }
        throw new Error(`${label} 必须为布尔值。`);
      }
      case 'array': {
        if (Array.isArray(raw)) {
          return this.cloneValue(raw);
        }
        if (typeof raw === 'string') {
          const trimmed = raw.trim();
          if (!trimmed) {
            return undefined;
          }
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              return parsed;
            }
          } catch (error) {
            throw new Error(`${label} 需要是 JSON 数组格式：${(error as Error).message}`);
          }
          throw new Error(`${label} 需要是数组或 JSON 数组字符串。`);
        }
        throw new Error(`${label} 需要是数组。`);
      }
      case 'object': {
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
          return this.cloneValue(raw);
        }
        if (typeof raw === 'string') {
          const trimmed = raw.trim();
          if (!trimmed) {
            return undefined;
          }
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              return parsed;
            }
          } catch (error) {
            throw new Error(`${label} 需要是 JSON 对象格式：${(error as Error).message}`);
          }
          throw new Error(`${label} 需要是对象或 JSON 对象字符串。`);
        }
        throw new Error(`${label} 需要是对象。`);
      }
      default:
        return raw;
    }
  }

  private areValuesEqual(a: unknown, b: unknown): boolean {
    if (a === b) {
      return true;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }
      return a.every((value, index) => this.areValuesEqual(value, b[index]));
    }
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a as Record<string, unknown>);
      const keysB = Object.keys(b as Record<string, unknown>);
      if (keysA.length !== keysB.length) {
        return false;
      }
      for (const key of keysA) {
        if (!Object.prototype.hasOwnProperty.call(b, key)) {
          return false;
        }
        if (!this.areValuesEqual(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key]
        )) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  private emitVariablesChanged(): void {
    this.emit('variablesChanged', this.listVariables());
  }

  private emitGraphChanged(): void {
    this.emit('graphChanged', this.toGraphDefinition());
  }
}
