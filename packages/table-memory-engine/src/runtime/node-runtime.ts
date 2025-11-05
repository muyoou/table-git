import { EventBus } from '../core/event-bus';
import { FormatterRegistry } from '../core/formatter';
import type { TableAdapter } from '../core/table-adapter';
import { ComposedTagParser, type TagParser } from '../core/tag-parser';
import type { FlowContext, NodeResult } from '../core/types';
import type { RuntimeNode, NodeServices } from '../nodes/base-node';
import { NodeRegistry } from '../nodes/registry';
import type {
  GraphDefinition,
  GraphEdgeMetadata,
  GraphMetadata,
  NodeInstance,
  NodeSchema,
  PortDefinition
} from './graph-types';

export interface ConnectionEndpoint {
  nodeType: string;
  portName?: string;
}

export interface ConnectionValidationOptions {
  from: ConnectionEndpoint;
  to: ConnectionEndpoint;
}

export interface NodeRuntimeOptions {
  adapter?: TableAdapter;
  parser?: TagParser;
  formatters?: FormatterRegistry;
  eventBus?: EventBus;
  registry?: NodeRegistry;
  logger?: (message: string, extras?: Record<string, unknown>) => void;
  services?: Record<string, unknown>;
}

export interface RunOptions {
  services?: Partial<NodeServices>;
}

export interface RunResult {
  context: FlowContext;
  state: Map<string, unknown>;
}

export class NodeRuntime {
  private readonly registry: NodeRegistry;
  private readonly parser: TagParser;
  private readonly formatters: FormatterRegistry;
  private readonly events: EventBus;
  private readonly defaults: Partial<NodeServices>;

  constructor(private readonly options: NodeRuntimeOptions = {}) {
    this.registry = options.registry ?? new NodeRegistry();
    this.parser = options.parser ?? new ComposedTagParser();
    this.formatters = options.formatters ?? new FormatterRegistry();
    this.events = options.eventBus ?? new EventBus();
    this.defaults = {
      adapter: options.adapter as TableAdapter,
      parser: this.parser,
      formatters: this.formatters,
      events: this.events,
      log: options.logger,
      ...(options.services ?? {})
    } as Partial<NodeServices>;
  }

  register(node: RuntimeNode): void {
    this.registry.register(node);
  }

  registerDefaults(): void {
    const { registerBuiltinNodes } = require('../nodes/builtins/register');
    registerBuiltinNodes(this);
  }

  getRegistry(): NodeRegistry {
    return this.registry;
  }

  getParser(): TagParser {
    return this.parser;
  }

  getFormatters(): FormatterRegistry {
    return this.formatters;
  }

  getEventBus(): EventBus {
    return this.events;
  }

  validateConnection(options: ConnectionValidationOptions): void {
    const source = this.registry.get(options.from.nodeType);
    const target = this.registry.get(options.to.nodeType);
    const sourceSchema = source.getSchema();
    const targetSchema = target.getSchema();

    const outputPort = this.resolvePortDefinition(sourceSchema.outputs, options.from.portName);
    if (!outputPort) {
      throw new Error(`未找到节点“${sourceSchema.label ?? sourceSchema.type}”的输出端口“${options.from.portName ?? 'default'}”。`);
    }

    const inputPort = this.resolvePortDefinition(targetSchema.inputs, options.to.portName);
    if (!inputPort) {
      throw new Error(`未找到节点“${targetSchema.label ?? targetSchema.type}”的输入端口“${options.to.portName ?? 'default'}”。`);
    }

    if (!this.areTypesCompatible(outputPort.type, inputPort.type)) {
      throw new Error(
        `无法连接：输出端口“${outputPort.label ?? outputPort.name}”类型为“${outputPort.type ?? '未指定'}”，` +
          `输入端口“${inputPort.label ?? inputPort.name}”类型为“${inputPort.type ?? '未指定'}”。`
      );
    }
  }

  async run(graph: GraphDefinition, flowContext: FlowContext, options: RunOptions = {}): Promise<RunResult> {
    this.assertAdapterProvided(options.services);
    const state = new Map<string, unknown>();
    const services = this.mergeServices(options.services);
    const nodeMap = new Map<string, NodeInstance>();
    for (const node of graph.nodes) {
      nodeMap.set(node.id, node);
    }
    const schemaCache = new Map<string, NodeSchema>();
    const edgeIndex = this.buildEdgeIndex(graph);

    await this.events.emit('beforeLoad', { sheetId: flowContext.sheetId });

    const ordered = this.resolveExecutionOrder(graph);
    const repeatQueue = new Set<number>();
    let currentIndex = 0;
    let repeatCurrent = false;
    while (currentIndex < ordered.length || repeatQueue.size > 0) {
      if (currentIndex >= ordered.length) {
        const nextIndex = Math.min(...repeatQueue);
        repeatQueue.delete(nextIndex);
        currentIndex = nextIndex;
        repeatCurrent = true;
      }
      const nodeDef = ordered[currentIndex];
      const node = this.registry.get(nodeDef.type);
      const schema = this.getSchemaFromCache(nodeDef.type, node, schemaCache);
      if (!repeatCurrent && this.requiresTrigger(schema) && !this.hasTriggerSignal(nodeDef, schema, edgeIndex, nodeMap, schemaCache, state)) {
        currentIndex += 1;
        continue;
      }
      await this.events.emit('beforeNode', { nodeId: nodeDef.id, nodeType: nodeDef.type });
      if (node.validate) {
        node.validate(nodeDef.config ?? {});
      }
      const inputs = this.resolveInputValues(nodeDef, schema, edgeIndex, nodeMap, schemaCache, state);
      const result = await node.execute({
        graph,
        node: nodeDef,
        flowContext,
        services,
        state,
        inputs
      });
      this.captureResult(nodeDef, result, state, flowContext);
      await this.events.emit('afterNode', { nodeId: nodeDef.id, nodeType: nodeDef.type });
      if (result?.repeat) {
        repeatQueue.add(currentIndex);
        repeatCurrent = false;
        currentIndex += 1;
        continue;
      }
      repeatQueue.delete(currentIndex);
      repeatCurrent = false;
      currentIndex += 1;
    }

    await this.events.emit('afterLoad', { sheetId: flowContext.sheetId });

    return { context: flowContext, state };
  }

  private mergeServices(override?: Partial<NodeServices>): NodeServices {
    const merged = {
      ...this.defaults,
      ...(override ?? {})
    } as NodeServices;

    if (!merged.adapter) {
      throw new Error('Table adapter is required but not provided.');
    }

    if (!merged.parser) {
      merged.parser = this.parser;
    }

    if (!merged.formatters) {
      merged.formatters = this.formatters;
    }

    if (!merged.events) {
      merged.events = this.events;
    }

    if (!merged.log) {
      merged.log = this.options.logger;
    }

    return merged;
  }

  private assertAdapterProvided(override?: Partial<NodeServices>): void {
    if (this.defaults.adapter || (override && override.adapter)) {
      return;
    }
    throw new Error('A TableAdapter instance must be provided via NodeRuntime options or run() overrides.');
  }

  private captureResult(node: NodeInstance, result: NodeResult | void, state: Map<string, unknown>, context: FlowContext): void {
    if (!result) {
      return;
    }
    if (result.outputs) {
      state.set(node.id, result.outputs);
    }
    if (result.events) {
      for (const evt of result.events) {
        this.events.emit(evt.event as never, {
          nodeId: node.id,
          nodeType: node.type,
          data: evt.payload as Record<string, unknown>
        }).catch(error => {
          this.options.logger?.('Event handler failure', { error });
        });
      }
    }
    if (result.warnings?.length) {
      this.options.logger?.('Node warnings', { node: node.id, warnings: result.warnings });
    }
  }

  private resolveExecutionOrder(graph: GraphDefinition): NodeInstance[] {
    if (!graph.nodes.length) {
      return [];
    }

    const adjacency = new Map<string, Set<string>>();
    const indegree = new Map<string, number>();

    for (const node of graph.nodes) {
      indegree.set(node.id, 0);
      if (node.next) {
        adjacency.set(node.id, new Set(node.next));
      }
    }

    for (const node of graph.nodes) {
      const next = node.next ?? [];
      for (const neighbor of next) {
        indegree.set(neighbor, (indegree.get(neighbor) ?? 0) + 1);
      }
    }

    const queue: NodeInstance[] = [];
    for (const node of graph.nodes) {
      if ((indegree.get(node.id) ?? 0) === 0) {
        queue.push(node);
      }
    }

    const ordered: NodeInstance[] = [];
    while (queue.length) {
      const current = queue.shift()!;
      ordered.push(current);
      const neighbors = adjacency.get(current.id);
      if (!neighbors) {
        continue;
      }
      for (const neighbor of neighbors) {
        const degree = (indegree.get(neighbor) ?? 0) - 1;
        indegree.set(neighbor, degree);
        if (degree === 0) {
          const nextNode = graph.nodes.find(n => n.id === neighbor);
          if (nextNode) {
            queue.push(nextNode);
          }
        }
      }
    }

    if (ordered.length !== graph.nodes.length) {
      throw new Error('Graph contains a cycle or disconnected node.');
    }

    return ordered;
  }

  private requiresTrigger(schema: NodeSchema): boolean {
    return (schema.inputs ?? []).some((port: PortDefinition) => {
      if (!port.type) {
        return false;
      }
      return port.type.toLowerCase() === 'flowevent' && port.required !== false;
    });
  }

  private hasTriggerSignal(
    node: NodeInstance,
    schema: NodeSchema,
    edgeIndex: Map<string, GraphEdgeMetadata[]>,
    nodeMap: Map<string, NodeInstance>,
    schemaCache: Map<string, NodeSchema>,
    state: Map<string, unknown>
  ): boolean {
    const flowInputs = (schema.inputs ?? []).filter(port => this.isFlowEventPort(port));
    if (flowInputs.length === 0) {
      return true;
    }

    const incomingEdges = edgeIndex.get(node.id) ?? [];
    if (!incomingEdges.length) {
      return false;
    }

    for (const edge of incomingEdges) {
      const inputName = this.resolvePortName(schema.inputs, edge.to.port);
      if (!inputName) {
        continue;
      }
      const inputDef = this.resolvePortDefinition(schema.inputs, inputName);
      if (!this.isFlowEventPort(inputDef)) {
        continue;
      }

      const upstreamNode = nodeMap.get(edge.from.nodeId);
      if (!upstreamNode) {
        continue;
      }

      const upstreamOutputs = state.get(edge.from.nodeId) as Record<string, unknown> | undefined;
      if (!upstreamOutputs) {
        continue;
      }

      const upstreamSchema = this.getSchemaFromCache(upstreamNode.type, undefined, schemaCache);
      const outputName = this.resolvePortName(upstreamSchema.outputs, edge.from.port);
      if (!outputName) {
        continue;
      }

      if (this.isFlowEventTruthy(upstreamOutputs[outputName])) {
        return true;
      }
    }

    if (node.config) {
      for (const port of flowInputs) {
        if (this.isFlowEventTruthy((node.config as Record<string, unknown>)[port.name])) {
          return true;
        }
      }
    }

    return false;
  }

  private isFlowEventTruthy(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value !== 0 && !Number.isNaN(value);
    }
    if (value === null || typeof value === 'undefined') {
      return false;
    }
    return true;
  }

  private buildEdgeIndex(graph: GraphDefinition): Map<string, GraphEdgeMetadata[]> {
    const index = new Map<string, GraphEdgeMetadata[]>();
    const metadataEdges = this.extractMetadataEdges(graph.metadata);
    for (const edge of metadataEdges) {
      this.addEdgeToIndex(index, edge);
    }

    for (const node of graph.nodes) {
      for (const nextId of node.next ?? []) {
        const existing = (index.get(nextId) ?? []).some(e => e.from?.nodeId === node.id);
        if (existing) {
          continue;
        }
        const edge: GraphEdgeMetadata = {
          from: { nodeId: node.id, port: 'trigger' },
          to: { nodeId: nextId, port: 'trigger' }
        };
        this.addEdgeToIndex(index, edge);
      }
    }

    return index;
  }

  private extractMetadataEdges(metadata?: GraphMetadata): GraphEdgeMetadata[] {
    if (!metadata || !Array.isArray(metadata.edges)) {
      return [];
    }
    return metadata.edges.filter(edge => Boolean(edge?.from?.nodeId && edge?.to?.nodeId));
  }

  private addEdgeToIndex(index: Map<string, GraphEdgeMetadata[]>, edge: GraphEdgeMetadata): void {
    const targetId = edge.to?.nodeId;
    const sourceId = edge.from?.nodeId;
    if (!targetId || !sourceId) {
      return;
    }
    if (!index.has(targetId)) {
      index.set(targetId, []);
    }
    index.get(targetId)!.push(edge);
  }

  private getSchemaFromCache(type: string, node: RuntimeNode | undefined, cache: Map<string, NodeSchema>): NodeSchema {
    if (cache.has(type)) {
      return cache.get(type)!;
    }
    const runtimeNode = node ?? this.registry.get(type);
    const schema = runtimeNode.getSchema();
    cache.set(type, schema);
    return schema;
  }

  private resolveInputValues(
    node: NodeInstance,
    schema: NodeSchema,
    edgeIndex: Map<string, GraphEdgeMetadata[]>,
    nodeMap: Map<string, NodeInstance>,
    schemaCache: Map<string, NodeSchema>,
    state: Map<string, unknown>
  ): Record<string, unknown> {
    const values: Record<string, unknown> = {};
    const edges = edgeIndex.get(node.id) ?? [];

    for (const edge of edges) {
      const inputName = this.resolvePortName(schema.inputs, edge.to.port);
      if (!inputName) {
        continue;
      }

      const sourceNode = nodeMap.get(edge.from.nodeId);
      if (!sourceNode) {
        continue;
      }
      const sourceOutputs = state.get(edge.from.nodeId) as Record<string, unknown> | undefined;
      if (!sourceOutputs || typeof sourceOutputs !== 'object') {
        continue;
      }

      const sourceSchema = this.getSchemaFromCache(sourceNode.type, undefined, schemaCache);
      const outputName = this.resolvePortName(sourceSchema.outputs, edge.from.port);
      if (!outputName) {
        continue;
      }

      const value = (sourceOutputs as Record<string, unknown>)[outputName];
      if (typeof value === 'undefined') {
        continue;
      }

      if (Object.prototype.hasOwnProperty.call(values, inputName)) {
        const existing = values[inputName];
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          values[inputName] = [existing, value];
        }
      } else {
        values[inputName] = value;
      }
    }

    this.applyConfigDefaults(values, node, schema);
    return values;
  }

  private resolvePortName(definitions: PortDefinition[] | undefined, requested?: string): string | undefined {
    if (requested) {
      return requested;
    }
    if (definitions && definitions.length > 0) {
      return definitions[0]!.name;
    }
    return undefined;
  }

  private applyConfigDefaults(target: Record<string, unknown>, node: NodeInstance, schema: NodeSchema): void {
    if (!node.config) {
      return;
    }
    for (const port of schema.inputs ?? []) {
      if (typeof target[port.name] === 'undefined' && port.name in node.config) {
        target[port.name] = node.config[port.name];
      }
    }
  }

  private isFlowEventPort(port?: PortDefinition): boolean {
    if (!port || !port.type) {
      return false;
    }
    return port.type.toLowerCase() === 'flowevent';
  }

  private resolvePortDefinition(defs: PortDefinition[] | undefined, name?: string): PortDefinition | undefined {
    if (!defs || defs.length === 0) {
      return undefined;
    }
    if (!name) {
      return defs[0];
    }
    return defs.find(port => port.name === name);
  }

  private areTypesCompatible(outputType?: string, inputType?: string): boolean {
    if (!outputType || !inputType) {
      return true;
    }
    const source = this.normalizeTypeName(outputType);
    const target = this.normalizeTypeName(inputType);
    if (source === 'any' || target === 'any') {
      return true;
    }
    return source === target;
  }

  private normalizeTypeName(type: string): string {
    return type.replace(/\s+/g, '').toLowerCase();
  }
}
