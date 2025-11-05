import { Application, Container, FederatedPointerEvent, Graphics, Rectangle } from 'pixi.js';
import type { FlowContext, NodeSchema } from '@table-git/memory-engine';
import type { NodeRuntime } from '@table-git/memory-engine';
import { GraphStore, type AddNodeOptions, type ConnectNodesOptions } from './graph-store';
import type {
  EditorNode,
  Edge,
  GraphDefinitionWithMetadata,
  NodePosition,
  PortDirection,
  EditorVariableState,
  EditorVariableType
} from './types';
import { NodeView } from './pixi/node-view';
import { ConnectionView } from './pixi/connection-view';
import type { PortView } from './pixi/port-view';
import { ParameterPanel } from './parameter-panel';

const DEFAULT_BACKGROUND = 0x0f172a;
const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 768;
const GRID_SIZE = 64;

type ContextMenuGroupId = 'events' | 'table' | 'constants' | 'strings' | 'regex' | 'conditions' | 'control' | 'math' | 'debug' | 'variables';

type VariableMenuOperation = 'get' | 'set' | 'init' | 'increment' | 'decrement';

const VARIABLE_MENU_TYPES: ReadonlyArray<{ type: string; label: string; summary: string; operation: VariableMenuOperation }> = [
  { type: '__variable_get__', label: '读取变量', summary: '选择一个已存在的变量并输出当前值。', operation: 'get' },
  { type: '__variable_set__', label: '写入变量', summary: '选择变量并写入新的值。', operation: 'set' },
  { type: '__variable_init__', label: '初始化变量', summary: '将变量重置为默认值。', operation: 'init' },
  { type: '__variable_increment__', label: '变量 ++', summary: '为选定的数值变量增加指定数值（默认为 1）。', operation: 'increment' },
  { type: '__variable_decrement__', label: '变量 --', summary: '为选定的数值变量减少指定数值（默认为 1）。', operation: 'decrement' }
];

const VARIABLE_NODE_TYPES: Record<VariableMenuOperation, Partial<Record<EditorVariableType, string>>> = {
  get: {
    string: 'VariableGetString',
    number: 'VariableGetNumber',
    boolean: 'VariableGetBoolean',
    array: 'VariableGetArray',
    object: 'VariableGetObject'
  },
  set: {
    string: 'VariableSetString',
    number: 'VariableSetNumber',
    boolean: 'VariableSetBoolean',
    array: 'VariableSetArray',
    object: 'VariableSetObject'
  },
  init: {
    string: 'VariableInitString',
    number: 'VariableInitNumber',
    boolean: 'VariableInitBoolean',
    array: 'VariableInitArray',
    object: 'VariableInitObject'
  },
  increment: {
    number: 'VariableIncrement'
  },
  decrement: {
    number: 'VariableDecrement'
  }
};

const CONTEXT_MENU_GROUPS: ReadonlyArray<{ id: ContextMenuGroupId; label: string; categories: readonly string[] }> = [
  { id: 'events', label: '事件', categories: ['event'] },
  { id: 'table', label: '表格操作', categories: ['table', 'ai', 'formatters'] },
  { id: 'constants', label: '常量', categories: ['constant', 'data'] },
  { id: 'strings', label: '字符串', categories: ['string', 'text'] },
  { id: 'regex', label: '正则', categories: ['regex'] },
  { id: 'conditions', label: '条件判断', categories: ['conditions', 'comparison', 'logic'] },
  { id: 'control', label: '控制', categories: ['control'] },
  { id: 'math', label: '数学', categories: ['math'] },
  { id: 'debug', label: '调试', categories: ['utility', 'debug'] },
  { id: 'variables', label: '变量', categories: ['variables'] }
];

interface PendingConnection {
  nodeId: string;
  portName: string;
  direction: PortDirection;
  portView: PortView;
}

interface ValueEditor {
  root: HTMLDivElement;
  title: HTMLDivElement;
  meta: HTMLDivElement;
  description: HTMLDivElement;
  textarea: HTMLTextAreaElement;
  hint: HTMLDivElement;
  saveButton: HTMLButtonElement;
  cancelButton: HTMLButtonElement;
  clearButton: HTMLButtonElement;
  active?: { nodeId: string; portName: string };
}

export interface NodeEditorOptions {
  container: HTMLElement | string;
  runtime: NodeRuntime;
  width?: number;
  height?: number;
  background?: number;
  autoRegisterBuiltinNodes?: boolean;
  graph?: GraphDefinitionWithMetadata;
}

type RuntimeRunOptions = Parameters<NodeRuntime['run']>[2];
type RuntimeRunResult = Awaited<ReturnType<NodeRuntime['run']>>;

type ResolvedContainer = { element: HTMLElement; width: number; height: number };
type VariableListener = (variables: EditorVariableState[]) => void;

export interface CreateEditorVariableOptions {
  name: string;
  type: EditorVariableType;
  defaultValue?: unknown;
}

export interface UpdateEditorVariableOptions {
  name?: string;
  type?: EditorVariableType;
  defaultValue?: unknown;
}

export class NodeEditor {
  static async create(options: NodeEditorOptions): Promise<NodeEditor> {
    const resolved = resolveContainer(options.container);
    const width = options.width ?? resolved.width ?? DEFAULT_WIDTH;
    const height = options.height ?? resolved.height ?? DEFAULT_HEIGHT;

    const background = options.background ?? DEFAULT_BACKGROUND;
    const app = supportsAsyncInit(Application)
      ? await createAsyncApplication(width, height, background)
      : createSyncApplication(width, height, background);

    const view = (app.view ?? (app as unknown as { canvas?: HTMLCanvasElement }).canvas) as HTMLCanvasElement | undefined;
    if (!view) {
      throw new Error('PixiJS application did not expose a canvas element.');
    }

    view.style.position = 'absolute';
    view.style.top = '0';
    view.style.left = '0';
    view.style.width = '100%';
    view.style.height = '100%';

    view.addEventListener('contextmenu', event => {
      event.preventDefault();
    });

    resolved.element.appendChild(view);

    if (resolved.element.style.position === '' || resolved.element.style.position === 'static') {
      resolved.element.style.position = 'relative';
    }

    const runtimeWithDefaults = options.runtime as NodeRuntime & { registerDefaults?: () => void; getRegistry(): { list(): unknown[] } };
    if (
      options.autoRegisterBuiltinNodes !== false &&
      typeof runtimeWithDefaults.registerDefaults === 'function' &&
      runtimeWithDefaults.getRegistry()?.list().length === 0
    ) {
      runtimeWithDefaults.registerDefaults();
    }

    return new NodeEditor(app, resolved.element, options.runtime, { width, height, graph: options.graph });
  }

  private readonly app: Application;
  private readonly runtime: NodeRuntime;
  private readonly container: HTMLElement;
  private readonly graph: GraphStore;
  private readonly grid: Graphics;
  private readonly nodeLayer: Container;
  private readonly connectionLayer: Container;
  private readonly previewConnection: Graphics;
  private totalOffset = { x: 0, y: 0 };
  private panning = false;
  private panStart?: { pointer: { x: number; y: number }; origin: { x: number; y: number } };
  private readonly parameterPanel: ParameterPanel;
  private readonly nodeViews = new Map<string, NodeView>();
  private readonly connectionViews = new Map<string, ConnectionView>();
  private readonly schemas = new Map<string, NodeSchema>();
  private readonly contextMenu: HTMLDivElement;
  private readonly contextMenuList: HTMLDivElement;
  private readonly containerPointerDownHandler: (event: PointerEvent) => void;
  private contextMenuVisible = false;
  private contextMenuPosition: { x: number; y: number } = { x: 0, y: 0 };
  private pendingConnection?: PendingConnection;
  private readonly valueEditor: ValueEditor;
  private activeSubmenu?: HTMLDivElement;
  private activeSubmenuTrigger?: HTMLButtonElement;
  private readonly variableListeners = new Set<VariableListener>();
  private readonly variablesChangedHandler: (variables: EditorVariableState[]) => void;
  private variablePickerOverlay?: HTMLDivElement;

  private constructor(app: Application, container: HTMLElement, runtime: NodeRuntime, options: { width: number; height: number; graph?: GraphDefinitionWithMetadata }) {
    this.app = app;
    this.runtime = runtime;
    this.container = container;

    this.graph = new GraphStore({
      id: options.graph?.id,
      label: options.graph?.label,
      description: options.graph?.description,
      metadata: options.graph?.metadata
    });
    this.variablesChangedHandler = variables => this.notifyVariableListeners(variables);
    this.graph.on('variablesChanged', this.variablesChangedHandler);

    this.connectionLayer = new Container();
    this.nodeLayer = new Container();
    this.previewConnection = new Graphics();
    this.previewConnection.visible = false;

  this.grid = new Graphics();
  this.drawGrid(options.width, options.height);
  this.grid.eventMode = 'none';

  this.app.stage.addChild(this.grid);
  this.app.stage.addChild(this.connectionLayer);
  this.connectionLayer.addChild(this.previewConnection);
  this.app.stage.addChild(this.nodeLayer);

    this.parameterPanel = new ParameterPanel({
      host: container,
      onSubmit: (nodeId, config) => this.graph.updateNodeConfig(nodeId, config)
    });
    this.parameterPanel.close();

    const { menu, list } = this.createContextMenu(container);
    this.contextMenu = menu;
    this.contextMenuList = list;
    this.valueEditor = this.createValueEditor(container);
    this.containerPointerDownHandler = event => {
      const targetNode = event.target as Node | null;
      if (this.contextMenuVisible) {
        if (!(typeof event.button === 'number' && event.button === 2) && !this.contextMenu.contains(targetNode)) {
          this.hideContextMenu();
        }
      }
      if (this.valueEditor.root.style.display !== 'none' && !this.valueEditor.root.contains(targetNode)) {
        this.closeValueEditor();
      }
      if (this.variablePickerOverlay && !this.variablePickerOverlay.contains(targetNode)) {
        this.closeVariablePicker();
      }
    };
    container.addEventListener('pointerdown', this.containerPointerDownHandler);

    this.registerGraphListeners();
    this.setupStageInteractions(options.width, options.height);
    this.refreshSchemas();

    if (options.graph) {
      this.graph.loadGraph(options.graph);
    }
  }

  destroy(): void {
    this.parameterPanel.close();
    this.graph.off('variablesChanged', this.variablesChangedHandler);
    this.variableListeners.clear();
    this.graph.removeAllListeners();
    this.previewConnection.destroy(true);
    this.grid.destroy(true);
    this.nodeLayer.removeChildren();
    this.connectionLayer.removeChildren();
    this.nodeViews.clear();
    this.connectionViews.clear();
    this.schemas.clear();
    this.container.removeEventListener('pointerdown', this.containerPointerDownHandler);
    this.contextMenu.remove();
    this.valueEditor.root.remove();
    this.closeVariablePicker();
    this.pendingConnection = undefined;
    this.app.destroy(true, { children: true });
  }

  refreshSchemas(): void {
    const registry = this.runtime.getRegistry();
    this.schemas.clear();
    for (const node of registry.list()) {
      const schema = node.getSchema();
      this.schemas.set(schema.type, schema);
    }
    this.buildContextMenuItems();
  }

  listVariables(): EditorVariableState[] {
    return this.graph.listVariables();
  }

  getVariable(id: string): EditorVariableState | undefined {
    return this.graph.getVariable(id);
  }

  createVariable(options: CreateEditorVariableOptions): EditorVariableState {
    return this.graph.addVariable(options);
  }

  updateVariable(id: string, updates: UpdateEditorVariableOptions): EditorVariableState {
    return this.graph.updateVariable(id, updates);
  }

  deleteVariable(id: string): void {
    this.graph.removeVariable(id);
  }

  setVariableValue(id: string, value: unknown): EditorVariableState {
    return this.graph.setVariableValue(id, value);
  }

  resetVariables(): void {
    this.graph.resetVariableValues();
  }

  getVariableValueMap(): Record<string, unknown> {
    return this.graph.getVariableValueMap();
  }

  onVariablesChanged(listener: VariableListener): () => void {
    this.variableListeners.add(listener);
    listener(this.graph.listVariables());
    return () => {
      this.variableListeners.delete(listener);
    };
  }

  addNode(type: string, options: Partial<Omit<AddNodeOptions, 'type'>> = {}): EditorNode {
    const schema = this.schemas.get(type);
    if (!schema) {
      throw new Error(`Unknown node type '${type}'`);
    }
    return this.graph.addNode({
      type,
      id: options.id,
      position: options.position,
      config: options.config,
      metadata: options.metadata
    });
  }

  connect(options: ConnectNodesOptions): Edge {
    return this.graph.connect(options);
  }

  disconnect(edgeId: string): void {
    this.graph.disconnect(edgeId);
  }

  removeNode(nodeId: string): void {
    this.graph.removeNode(nodeId);
  }

  listNodes(): EditorNode[] {
    return this.graph.listNodes();
  }

  listEdges(): Edge[] {
    return this.graph.listEdges();
  }

  loadGraph(graph: GraphDefinitionWithMetadata): void {
    this.graph.loadGraph(graph);
  }

  toGraphDefinition(): GraphDefinitionWithMetadata {
    return this.graph.toGraphDefinition();
  }

  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
    this.app.stage.hitArea = new Rectangle(0, 0, width, height);
    this.drawGrid(width, height);
  }

  async run(context: FlowContext, options?: RuntimeRunOptions): Promise<RuntimeRunResult> {
    this.graph.resetVariableValues();
    const variableValues = this.graph.getVariableValueMap();
    const baseOptions = options ?? {};
    const mergedOptions: RuntimeRunOptions = {
      ...baseOptions,
      services: {
        ...(baseOptions.services ?? {}),
        variables: variableValues
      }
    };
    const result = await this.runtime.run(this.graph.toGraphDefinition(), context, mergedOptions);
    const runtimeVariables = (mergedOptions.services?.variables ?? {}) as Record<string, unknown>;
    this.graph.applyRuntimeVariableValues(runtimeVariables);
    return result;
  }

  private registerGraphListeners(): void {
    this.graph.on('nodeAdded', node => this.handleNodeAdded(node));
    this.graph.on('nodeMoved', node => this.handleNodeMoved(node));
    this.graph.on('nodeUpdated', node => this.handleNodeUpdated(node));
    this.graph.on('nodeRemoved', payload => this.handleNodeRemoved(payload.nodeId));
  this.graph.on('edgeAdded', edge => this.handleEdgeAdded(edge));
  this.graph.on('edgeRemoved', edge => this.handleEdgeRemoved(edge));
  }

  private notifyVariableListeners(variables: EditorVariableState[]): void {
    for (const listener of this.variableListeners) {
      listener(variables);
    }
  }

  private setupStageInteractions(width: number, height: number): void {
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = new Rectangle(0, 0, width, height);
  this.app.stage.on('pointerdown', (event: FederatedPointerEvent) => this.handleStagePointerDown(event));
  this.app.stage.on('pointermove', (event: FederatedPointerEvent) => this.handleStagePointerMove(event));
  this.app.stage.on('pointerup', (event: FederatedPointerEvent) => this.handleStagePointerUp(event));
  this.app.stage.on('pointerupoutside', (event: FederatedPointerEvent) => this.handleStagePointerUp(event));
  }

  private handleNodeAdded(node: EditorNode): void {
    const schema = this.schemas.get(node.type) ?? this.buildFallbackSchema(node.type);
    const view = new NodeView({
      node,
      schema,
      onDrag: (nodeId, position) => this.graph.moveNode(nodeId, position),
      onDoubleClick: nodeId => this.handleNodeDoubleClick(nodeId),
      onPortPointerDown: (nodeId, portName, direction, event) => this.handlePortPointerDown(nodeId, portName, direction, event),
      onPortPointerUp: (nodeId, portName, direction, event) => this.handlePortPointerUp(nodeId, portName, direction, event),
      onInputValueEdit: (nodeId, portName, anchor) => this.handleInputValueEdit(nodeId, portName, anchor)
    });

    this.nodeViews.set(node.id, view);
    this.nodeLayer.addChild(view);
    this.updateConnectionsForNode(node.id);
  }

  private handleNodeMoved(node: EditorNode): void {
    const view = this.nodeViews.get(node.id);
    if (!view) {
      return;
    }
    view.updatePosition(node.position);
    this.updateConnectionsForNode(node.id);
  }

  private handleNodeUpdated(node: EditorNode): void {
    const view = this.nodeViews.get(node.id);
    if (!view) {
      return;
    }
    view.updateConfig(node.config);
  }

  private handleNodeRemoved(nodeId: string): void {
    const view = this.nodeViews.get(nodeId);
    if (view) {
      this.nodeLayer.removeChild(view);
      this.nodeViews.delete(nodeId);
    }
    if (this.valueEditor.active?.nodeId === nodeId) {
      this.closeValueEditor();
    }
    for (const [edgeId, connection] of [...this.connectionViews.entries()]) {
      const edge = this.graph.getEdge(edgeId);
      if (!edge || edge.from.nodeId === nodeId || edge.to.nodeId === nodeId) {
        this.connectionLayer.removeChild(connection);
        this.connectionViews.delete(edgeId);
      }
    }
  }

  private handleEdgeAdded(edge: Edge): void {
    const connection = new ConnectionView({
      id: edge.id,
      onRequestRemove: id => this.graph.disconnect(id)
    });
    this.connectionViews.set(edge.id, connection);
    this.connectionLayer.addChild(connection);
    this.updateConnection(edge.id);
    this.updatePortConnectionState(edge.from.nodeId, edge.from.port, 'output');
    this.updatePortConnectionState(edge.to.nodeId, edge.to.port, 'input');
    if (this.valueEditor.active && this.valueEditor.active.nodeId === edge.to.nodeId) {
      if (this.isSamePort(edge.to.port, this.valueEditor.active.portName)) {
        this.closeValueEditor();
      }
    }
  }

  private handleEdgeRemoved(edge: Edge): void {
    const connection = this.connectionViews.get(edge.id);
    if (connection) {
      this.connectionLayer.removeChild(connection);
      this.connectionViews.delete(edge.id);
    }
    this.updatePortConnectionState(edge.from.nodeId, edge.from.port, 'output');
    this.updatePortConnectionState(edge.to.nodeId, edge.to.port, 'input');
  }

  private handleNodeDoubleClick(nodeId: string): void {
    // Parameter panel disabled - all config moved to input ports
  }

  private handlePortPointerDown(nodeId: string, portName: string, direction: PortDirection, event: FederatedPointerEvent): void {
    if (this.isRightClick(event)) {
      this.preventPointerDefault(event);
      this.disconnectPort(nodeId, portName, direction);
      this.cancelPendingConnection();
      return;
    }

    if (direction === 'output') {
      this.beginConnection(nodeId, portName, direction);
    } else if (direction === 'input') {
      // allow disconnect by alt-click on input port
      if (event.originalEvent instanceof PointerEvent && event.originalEvent.altKey) {
        for (const edge of this.graph.listEdges()) {
          if (edge.to.nodeId === nodeId && edge.to.port === portName) {
            this.graph.disconnect(edge.id);
          }
        }
      } else {
        this.beginConnection(nodeId, portName, direction);
      }
    }
  }

  private handlePortPointerUp(nodeId: string, portName: string, direction: PortDirection, event: FederatedPointerEvent): void {
    if (!this.pendingConnection) {
      return;
    }
    if (this.isRightClick(event)) {
      this.cancelPendingConnection();
      return;
    }
    if (event.originalEvent instanceof PointerEvent) {
      event.originalEvent.stopPropagation();
      event.originalEvent.preventDefault();
    }

    if (this.pendingConnection.direction === 'output' && direction === 'input') {
      this.attemptConnection({
        fromNodeId: this.pendingConnection.nodeId,
        fromPort: this.pendingConnection.portName,
        toNodeId: nodeId,
        toPort: portName
      });
    } else if (this.pendingConnection.direction === 'input' && direction === 'output') {
      this.attemptConnection({
        fromNodeId: nodeId,
        fromPort: portName,
        toNodeId: this.pendingConnection.nodeId,
        toPort: this.pendingConnection.portName
      });
    }

    this.cancelPendingConnection();
  }

  private beginConnection(nodeId: string, portName: string, direction: PortDirection): void {
    const view = this.nodeViews.get(nodeId);
    if (!view) {
      return;
    }
    const portView = view.getPort(direction, portName) ?? view.listPorts(direction)[0];
    if (!portView) {
      return;
    }

    this.pendingConnection = { nodeId, portName, direction, portView };
    this.previewConnection.clear();
    this.previewConnection.lineStyle(2, 0x94a3b8, 0.85);
    this.previewConnection.visible = true;
  }

  private handleStagePointerMove(event: FederatedPointerEvent): void {
    if (this.panning && this.panStart) {
      const dx = event.global.x - this.panStart.pointer.x;
      const dy = event.global.y - this.panStart.pointer.y;
      const offsetX = this.panStart.origin.x + dx;
      const offsetY = this.panStart.origin.y + dy;
      this.applyPan(offsetX, offsetY);
      return;
    }

    if (!this.pendingConnection) {
      return;
    }
    const start = this.pendingConnection.portView.getAnchorPosition();
    const end = event.global;
    this.previewConnection.clear();
    this.previewConnection.lineStyle(2, 0x94a3b8, 0.85);
    const localStartX = start.x - this.totalOffset.x;
    const localStartY = start.y - this.totalOffset.y;
    const localEndX = end.x - this.totalOffset.x;
    const localEndY = end.y - this.totalOffset.y;
    this.previewConnection.moveTo(localStartX, localStartY);
    const cpOffset = Math.max(Math.abs(localEndX - localStartX) / 2, 80);
    const cp1x = localStartX + (this.pendingConnection.direction === 'output' ? cpOffset : -cpOffset);
    const cp2x = localEndX + (this.pendingConnection.direction === 'output' ? -cpOffset : cpOffset);
    this.previewConnection.bezierCurveTo(cp1x, localStartY, cp2x, localEndY, localEndX, localEndY);
  }

  private cancelPendingConnection(): void {
    if (!this.pendingConnection) {
      return;
    }
    this.pendingConnection = undefined;
    this.previewConnection.visible = false;
    this.previewConnection.clear();
  }

  private attemptConnection(options: { fromNodeId: string; fromPort?: string; toNodeId: string; toPort?: string }): void {
    const fromNode = this.graph.getNode(options.fromNodeId);
    const toNode = this.graph.getNode(options.toNodeId);
    if (!fromNode || !toNode) {
      return;
    }

    try {
      this.runtime.validateConnection({
        from: { nodeType: fromNode.type, portName: options.fromPort },
        to: { nodeType: toNode.type, portName: options.toPort }
      });
    } catch (error) {
      this.reportConnectionError(error);
      return;
    }

    this.graph.connect({
      fromNodeId: options.fromNodeId,
      toNodeId: options.toNodeId,
      fromPort: options.fromPort,
      toPort: options.toPort
    });
  }

  private reportConnectionError(error: unknown): void {
    const message = error instanceof Error ? error.message : '连接失败：端口类型不兼容。';
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(message);
    } else {
      console.warn(message);
    }
  }

  private disconnectPort(nodeId: string, portName: string | undefined, direction: PortDirection): void {
    const edges = this.graph.listEdges();
    for (const edge of edges) {
      const match = direction === 'output'
        ? edge.from.nodeId === nodeId && this.isSamePort(edge.from.port, portName)
        : edge.to.nodeId === nodeId && this.isSamePort(edge.to.port, portName);
      if (match) {
        this.graph.disconnect(edge.id);
      }
    }
  }

  private isRightClick(event: FederatedPointerEvent): boolean {
    if (typeof event.button === 'number' && event.button === 2) {
      return true;
    }
    if (typeof event.buttons === 'number' && (event.buttons & 2) === 2) {
      return true;
    }
    const original = event.originalEvent;
    if (original instanceof PointerEvent && original.button === 2) {
      return true;
    }
    if (original instanceof MouseEvent && original.button === 2) {
      return true;
    }
    return false;
  }

  private preventPointerDefault(event: FederatedPointerEvent): void {
    const hooks = event as unknown as { preventDefault?: () => void };
    hooks.preventDefault?.();
    const original = event.originalEvent;
    if (original && typeof (original as { preventDefault?: () => void }).preventDefault === 'function') {
      (original as { preventDefault?: () => void }).preventDefault?.();
    }
  }

  private isSamePort(edgePort?: string, requested?: string): boolean {
    if (edgePort === requested) {
      return true;
    }
    const normalizedEdge = edgePort ?? 'default';
    const normalizedRequested = requested ?? 'default';
    if (normalizedEdge === normalizedRequested) {
      return true;
    }
    if ((normalizedEdge === 'trigger' && normalizedRequested === 'default') || (normalizedEdge === 'default' && normalizedRequested === 'trigger')) {
      return true;
    }
    return false;
  }

  private updateConnectionsForNode(nodeId: string): void {
    for (const [edgeId, edgeView] of this.connectionViews.entries()) {
      const edge = this.graph.getEdge(edgeId);
      if (!edge) {
        continue;
      }
      if (edge.from.nodeId === nodeId || edge.to.nodeId === nodeId) {
        this.updateConnection(edgeId, edgeView);
      }
    }
  }

  private updateConnection(edgeId: string, view?: ConnectionView): void {
    const edge = this.graph.getEdge(edgeId);
    if (!edge) {
      return;
    }
    const connectionView = view ?? this.connectionViews.get(edgeId);
    if (!connectionView) {
      return;
    }

    const fromPosition = this.getPortPosition(edge.from.nodeId, 'output', edge.from.port);
    const toPosition = this.getPortPosition(edge.to.nodeId, 'input', edge.to.port);

    connectionView.redraw(
      {
        x: fromPosition.x - this.totalOffset.x,
        y: fromPosition.y - this.totalOffset.y
      },
      {
        x: toPosition.x - this.totalOffset.x,
        y: toPosition.y - this.totalOffset.y
      },
      {
      trigger: this.isTriggerConnection(edge)
      }
    );
  }

  private getPortPosition(nodeId: string, direction: PortDirection, portName?: string): { x: number; y: number } {
    const view = this.nodeViews.get(nodeId);
    if (!view) {
      return { x: 0, y: 0 };
    }
    const port = (portName ? view.getPort(direction, portName) : undefined) ?? view.listPorts(direction)[0];
    if (port) {
      return port.getAnchorPosition();
    }
    return view.getGlobalPosition();
  }

  private createContextMenu(host: HTMLElement): { menu: HTMLDivElement; list: HTMLDivElement } {
    const menu = document.createElement('div');
    menu.style.position = 'absolute';
    menu.style.top = '0';
    menu.style.left = '0';
    menu.style.display = 'none';
    menu.style.minWidth = '180px';
    menu.style.padding = '8px 0';
    menu.style.background = 'rgba(17, 24, 39, 0.95)';
    menu.style.border = '1px solid rgba(148, 163, 184, 0.35)';
    menu.style.borderRadius = '10px';
    menu.style.color = '#e2e8f0';
    menu.style.zIndex = '20';

    const title = document.createElement('div');
    title.textContent = '新建节点菜单';
    title.style.fontSize = '12px';
    title.style.color = '#94a3b8';
    title.style.padding = '4px 16px 6px';
    title.style.borderBottom = '1px solid rgba(148, 163, 184, 0.25)';

    const list = document.createElement('div');
    list.style.position = 'relative';
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.padding = '4px 0';
    list.style.gap = '0';
    menu.appendChild(list);
    menu.insertBefore(title, list);

    host.appendChild(menu);

    return { menu, list };
  }

  private createValueEditor(host: HTMLElement): ValueEditor {
    const root = document.createElement('div');
    root.style.position = 'absolute';
    root.style.display = 'none';
    root.style.minWidth = '280px';
    root.style.maxWidth = '320px';
    root.style.padding = '16px';
    root.style.background = 'rgba(15, 23, 42, 0.98)';
    root.style.border = '1px solid rgba(148, 163, 184, 0.4)';
    root.style.borderRadius = '12px';
    root.style.color = '#e2e8f0';
    root.style.zIndex = '25';
    root.style.boxShadow = '0 20px 40px rgba(15, 23, 42, 0.45)';

    const title = document.createElement('div');
    title.style.fontSize = '14px';
    title.style.fontWeight = '600';
    title.style.marginBottom = '6px';

    const meta = document.createElement('div');
    meta.style.fontSize = '12px';
    meta.style.color = '#94a3b8';
    meta.style.marginBottom = '8px';

    const description = document.createElement('div');
    description.style.fontSize = '12px';
    description.style.color = '#cbd5f5';
    description.style.marginBottom = '10px';
    description.style.lineHeight = '1.45';

    const textarea = document.createElement('textarea');
    textarea.style.width = '100%';
    textarea.style.minHeight = '120px';
    textarea.style.resize = 'vertical';
    textarea.style.borderRadius = '8px';
    textarea.style.border = '1px solid rgba(148, 163, 184, 0.35)';
    textarea.style.background = 'rgba(30, 41, 59, 0.85)';
    textarea.style.color = '#f8fafc';
    textarea.style.fontFamily = 'Menlo, Consolas, monospace';
    textarea.style.fontSize = '12px';
    textarea.style.padding = '8px';
    textarea.style.outline = 'none';

    const hint = document.createElement('div');
    hint.textContent = '留空表示使用默认或上游输入，支持 JSON 格式或直接输入字符串。';
    hint.style.fontSize = '11px';
    hint.style.color = '#94a3b8';
    hint.style.marginTop = '8px';

    const buttons = document.createElement('div');
    buttons.style.display = 'flex';
    buttons.style.gap = '8px';
    buttons.style.marginTop = '12px';

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.textContent = '保存';
    saveButton.style.flex = '1';
    saveButton.style.padding = '8px 12px';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '8px';
    saveButton.style.background = '#6366f1';
    saveButton.style.color = '#f8fafc';
    saveButton.style.cursor = 'pointer';

    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.textContent = '清空';
    clearButton.style.flex = '1';
    clearButton.style.padding = '8px 12px';
    clearButton.style.border = 'none';
    clearButton.style.borderRadius = '8px';
    clearButton.style.background = 'rgba(148, 163, 184, 0.25)';
    clearButton.style.color = '#f8fafc';
    clearButton.style.cursor = 'pointer';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = '取消';
    cancelButton.style.flex = '1';
    cancelButton.style.padding = '8px 12px';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '8px';
    cancelButton.style.background = 'rgba(30, 41, 59, 0.85)';
    cancelButton.style.color = '#f8fafc';
    cancelButton.style.cursor = 'pointer';

    buttons.appendChild(saveButton);
    buttons.appendChild(clearButton);
    buttons.appendChild(cancelButton);

    root.appendChild(title);
    root.appendChild(meta);
    root.appendChild(description);
    root.appendChild(textarea);
    root.appendChild(hint);
    root.appendChild(buttons);
    host.appendChild(root);

    const editor: ValueEditor = {
      root,
      title,
      meta,
      description,
      textarea,
      hint,
      saveButton,
      cancelButton,
      clearButton
    };

    saveButton.addEventListener('click', () => this.handleValueEditorSubmit());
    clearButton.addEventListener('click', () => this.handleValueEditorClear());
    cancelButton.addEventListener('click', () => this.closeValueEditor());

    return editor;
  }

  private handleInputValueEdit(nodeId: string, portName: string, anchor: { x: number; y: number }): void {
    const node = this.graph.getNode(nodeId);
    if (!node) {
      return;
    }
    const connected = this.graph.listEdges().some(edge => edge.to.nodeId === nodeId && this.isSamePort(edge.to.port, portName));
    if (connected) {
      return;
    }

    const schema = this.schemas.get(node.type) ?? this.buildFallbackSchema(node.type);
    const port = schema.inputs?.find(input => input.name === portName);
    const value = node.config?.[portName];
    this.showValueEditor({
      nodeId,
      portName,
      anchor,
      nodeLabel: schema.label ?? schema.type,
      port,
      value
    });
  }

  private showValueEditor(options: {
    nodeId: string;
    portName: string;
    anchor: { x: number; y: number };
    nodeLabel: string;
    port?: { label?: string; type?: string; description?: string };
    value: unknown;
  }): void {
    this.hideContextMenu();
    const editor = this.valueEditor;
    editor.active = { nodeId: options.nodeId, portName: options.portName };

    const titleLabel = options.port?.label ?? options.portName;
    editor.title.textContent = `编辑参数：${titleLabel}`;

    const metaParts: string[] = [`节点：${options.nodeLabel}`];
    if (options.port?.type) {
      metaParts.push(`类型：${options.port.type}`);
    }
    editor.meta.textContent = metaParts.join(' · ');

    if (options.port?.description) {
      editor.description.textContent = options.port.description;
      editor.description.style.display = 'block';
    } else {
      editor.description.textContent = '';
      editor.description.style.display = 'none';
    }

    editor.textarea.value = this.formatValueForEditor(options.value);

    editor.root.style.display = 'block';

    const hostRect = this.container.getBoundingClientRect();
    const editorRect = editor.root.getBoundingClientRect();
    let left = options.anchor.x + 12;
    let top = options.anchor.y + 12;

    if (left + editorRect.width > hostRect.width) {
      left = Math.max(0, hostRect.width - editorRect.width - 12);
    }
    if (top + editorRect.height > hostRect.height) {
      top = Math.max(0, hostRect.height - editorRect.height - 12);
    }

    editor.root.style.left = `${left}px`;
    editor.root.style.top = `${top}px`;

    requestAnimationFrame(() => {
      editor.textarea.focus();
      editor.textarea.select();
    });
  }

  private closeValueEditor(): void {
    this.valueEditor.active = undefined;
    this.valueEditor.root.style.display = 'none';
    this.valueEditor.textarea.value = '';
  }

  private handleValueEditorSubmit(): void {
    if (!this.valueEditor.active) {
      return;
    }
    const { nodeId, portName } = this.valueEditor.active;
    const parsed = this.parseEditorValue(this.valueEditor.textarea.value);
    this.applyInputValue(nodeId, portName, parsed);
    this.closeValueEditor();
  }

  private handleValueEditorClear(): void {
    if (!this.valueEditor.active) {
      return;
    }
    const { nodeId, portName } = this.valueEditor.active;
    this.applyInputValue(nodeId, portName, { remove: true });
    this.closeValueEditor();
  }

  private parseEditorValue(raw: string): { remove: boolean; value?: unknown } {
    const trimmed = raw.trim();
    if (!trimmed) {
      return { remove: true };
    }
    try {
      return { remove: false, value: JSON.parse(trimmed) };
    } catch {
      return { remove: false, value: raw };
    }
  }

  private formatValueForEditor(value: unknown): string {
    if (typeof value === 'undefined') {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  private applyInputValue(nodeId: string, portName: string, update: { remove: boolean; value?: unknown }): void {
    if (update.remove) {
      const node = this.graph.getNode(nodeId);
      if (!node) {
        return;
      }
      const nextConfig = { ...(node.config ?? {}) } as Record<string, unknown>;
      delete nextConfig[portName];
      this.graph.updateNodeConfig(nodeId, nextConfig, { merge: false });
      return;
    }
    this.graph.updateNodeConfig(nodeId, { [portName]: update.value } as Record<string, unknown>, { merge: true });
  }

  private buildContextMenuItems(): void {
    if (!this.contextMenuList) {
      return;
    }
    this.contextMenuList.innerHTML = '';
    this.closeActiveSubmenu();

    const visibleSchemas = [...this.schemas.values()].filter(schema => schema.uiHints?.showInMenu !== false);
    const grouped = this.groupSchemas(visibleSchemas);
    const variableGroup = grouped.find(group => group.id === 'variables');
    if (variableGroup) {
      const customItems = VARIABLE_MENU_TYPES.map(entry => ({
        type: entry.type,
        label: entry.label,
        summary: entry.summary,
        category: 'variables'
      } satisfies NodeSchema));
      variableGroup.items = [...customItems, ...variableGroup.items];
    }
    let totalItems = 0;
    const groupsToRender = grouped.filter(group => group.items.length > 0);

    groupsToRender.forEach((group, index) => {
      totalItems += group.items.length;
      const element = this.createContextMenuGroup(group, index === groupsToRender.length - 1);
      this.contextMenuList.appendChild(element);
    });

    if (!totalItems) {
      const empty = document.createElement('div');
      empty.textContent = '无可用节点';
      empty.style.padding = '6px 16px';
      empty.style.fontSize = '12px';
      empty.style.color = '#94a3b8';
      this.contextMenuList.appendChild(empty);
    }
  }

  private groupSchemas(schemas: NodeSchema[]): Array<{ id: ContextMenuGroupId; label: string; items: NodeSchema[] }> {
    const buckets = CONTEXT_MENU_GROUPS.map(group => ({
      id: group.id as ContextMenuGroupId,
      label: group.label,
      items: [] as NodeSchema[]
    }));
    const fallbackId: ContextMenuGroupId = 'table';

    const sorted = [...schemas].sort((a, b) => {
      const labelA = a.label ?? a.type;
      const labelB = b.label ?? b.type;
      return labelA.localeCompare(labelB, 'zh-CN');
    });

    for (const schema of sorted) {
      const category = schema.category ?? '';
      const matched = CONTEXT_MENU_GROUPS.find(group => group.categories.includes(category));
      const targetId = (matched?.id ?? fallbackId) as ContextMenuGroupId;
      const bucket = buckets.find(item => item.id === targetId);
      bucket?.items.push(schema);
    }

    return buckets;
  }

  private createContextMenuGroup(
    group: { id: ContextMenuGroupId; label: string; items: NodeSchema[] },
    isLast: boolean
  ): HTMLDivElement {
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.padding = '0';
    if (!isLast) {
      container.style.borderBottom = '1px solid rgba(148, 163, 184, 0.16)';
    }

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.style.display = 'flex';
    trigger.style.alignItems = 'center';
    trigger.style.justifyContent = 'space-between';
    trigger.style.width = '100%';
    trigger.style.padding = '8px 16px';
    trigger.style.background = 'transparent';
    trigger.style.border = 'none';
    trigger.style.fontSize = '13px';
    trigger.style.color = '#e2e8f0';
    trigger.style.cursor = 'pointer';

    const label = document.createElement('span');
    label.textContent = group.label;
    const arrow = document.createElement('span');
    arrow.textContent = '>';
    arrow.style.fontSize = '12px';
    arrow.style.color = '#94a3b8';

    trigger.appendChild(label);
    trigger.appendChild(arrow);

    const submenu = document.createElement('div');
    submenu.style.position = 'absolute';
    submenu.style.top = '0';
    submenu.style.left = '100%';
    submenu.style.display = 'none';
    submenu.style.minWidth = '200px';
    submenu.style.padding = '6px 0';
    submenu.style.background = 'rgba(15, 23, 42, 0.98)';
    submenu.style.border = '1px solid rgba(148, 163, 184, 0.35)';
    submenu.style.borderRadius = '10px';
    submenu.style.boxShadow = '0 16px 32px rgba(15, 23, 42, 0.45)';
    submenu.style.zIndex = '21';

    for (const schema of group.items) {
      const item = document.createElement('button');
      item.type = 'button';
      item.textContent = schema.label ?? schema.type;
      item.style.display = 'block';
      item.style.width = '100%';
      item.style.padding = '6px 16px';
      item.style.background = 'transparent';
      item.style.border = 'none';
      item.style.textAlign = 'left';
      item.style.fontSize = '13px';
      item.style.color = '#e2e8f0';
      item.style.cursor = 'pointer';

      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(99, 102, 241, 0.25)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
      });
      item.addEventListener('click', event => {
        event.stopPropagation();
        this.handleContextMenuSelection(schema.type);
      });

      submenu.appendChild(item);
    }

    container.appendChild(trigger);
    container.appendChild(submenu);

    const open = () => this.openSubmenu(container, submenu, trigger);

    container.addEventListener('mouseenter', open);
    trigger.addEventListener('focus', open);
    trigger.addEventListener('mouseenter', open);
    trigger.addEventListener('click', event => {
      event.stopPropagation();
      open();
    });
    container.addEventListener('mouseleave', () => {
      if (this.activeSubmenu === submenu) {
        this.closeActiveSubmenu();
      }
    });

    return container;
  }

  private openSubmenu(container: HTMLDivElement, submenu: HTMLDivElement, trigger: HTMLButtonElement): void {
    if (this.activeSubmenu === submenu) {
      return;
    }

    this.closeActiveSubmenu();

    submenu.style.display = 'block';
    trigger.style.background = 'rgba(99, 102, 241, 0.22)';
    this.activeSubmenu = submenu;
    this.activeSubmenuTrigger = trigger;
    this.positionSubmenu(container, submenu);
  }

  private positionSubmenu(container: HTMLDivElement, submenu: HTMLDivElement): void {
    submenu.style.left = '100%';
    submenu.style.top = '0px';

    const hostRect = this.container.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const submenuRect = submenu.getBoundingClientRect();

    let left = containerRect.width;
    if (submenuRect.right > hostRect.right - 8) {
      left = -submenuRect.width;
    }

    let topOffset = 0;
    let projectedTop = submenuRect.top;
    let projectedBottom = submenuRect.bottom;
    const bottomLimit = hostRect.bottom - 8;
    const topLimit = hostRect.top + 8;

    if (projectedBottom > bottomLimit) {
      const adjustment = projectedBottom - bottomLimit;
      topOffset -= adjustment;
      projectedTop -= adjustment;
      projectedBottom -= adjustment;
    }

    if (projectedTop < topLimit) {
      const adjustment = topLimit - projectedTop;
      topOffset += adjustment;
    }

    submenu.style.left = `${left}px`;
    submenu.style.top = `${topOffset}px`;
  }

  private closeActiveSubmenu(): void {
    if (this.activeSubmenu) {
      this.activeSubmenu.style.display = 'none';
      this.activeSubmenu = undefined;
    }
    if (this.activeSubmenuTrigger) {
      this.activeSubmenuTrigger.style.background = 'transparent';
      this.activeSubmenuTrigger = undefined;
    }
  }

  private handleContextMenuSelection(type: string): void {
    const localX = this.contextMenuPosition.x - this.totalOffset.x;
    const localY = this.contextMenuPosition.y - this.totalOffset.y;
    const position = {
      x: Math.max(0, localX - 120),
      y: Math.max(0, localY - 48)
    } satisfies NodePosition;

    const variableMenu = VARIABLE_MENU_TYPES.find(item => item.type === type);
    if (variableMenu) {
      this.hideContextMenu();
      this.openVariableNodeCreator(variableMenu.operation, position);
      return;
    }

    try {
      this.addNode(type, { position });
    } finally {
      this.hideContextMenu();
    }
  }

  private showContextMenu(x: number, y: number): void {
    this.buildContextMenuItems();
    this.contextMenuPosition = { x, y };
    this.contextMenu.style.display = 'block';
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;

    const hostRect = this.container.getBoundingClientRect();
    const menuRect = this.contextMenu.getBoundingClientRect();

    let left = x;
    let top = y;

    if (left + menuRect.width > hostRect.width) {
      left = Math.max(0, hostRect.width - menuRect.width - 8);
    }
    if (top + menuRect.height > hostRect.height) {
      top = Math.max(0, hostRect.height - menuRect.height - 8);
    }

    this.contextMenu.style.left = `${left}px`;
    this.contextMenu.style.top = `${top}px`;
    this.contextMenuVisible = true;
  }

  private hideContextMenu(): void {
    if (!this.contextMenuVisible) {
      return;
    }
    this.contextMenu.style.display = 'none';
    this.closeActiveSubmenu();
    this.contextMenuVisible = false;
  }

  private handleStagePointerDown(event: FederatedPointerEvent): void {
    if (this.isRightClick(event) && this.isBackgroundTarget(event)) {
      this.preventPointerDefault(event);
      this.showContextMenu(event.global.x, event.global.y);
      this.cancelPendingConnection();
      this.closeVariablePicker();
      return;
    }

    if (!this.isRightClick(event)) {
      this.hideContextMenu();
      this.closeVariablePicker();
    }

    if (event.button === 0 && this.isBackgroundTarget(event)) {
      this.panning = true;
      this.panStart = {
        pointer: { x: event.global.x, y: event.global.y },
        origin: { ...this.totalOffset }
      };
      return;
    }
  }

  private isBackgroundTarget(event: FederatedPointerEvent): boolean {
    const target = (event as unknown as { target?: unknown }).target;
    return target === this.app.stage || target === this.grid;
  }

  private handleStagePointerUp(event: FederatedPointerEvent): void {
    if (this.panning) {
      this.panning = false;
      this.panStart = undefined;
    }
    this.cancelPendingConnection();
  }

  private applyPan(x: number, y: number): void {
    this.totalOffset = { x, y };
    this.nodeLayer.x = x;
    this.nodeLayer.y = y;
    this.connectionLayer.x = x;
    this.connectionLayer.y = y;
    this.grid.x = x;
    this.grid.y = y;
  }

  private drawGrid(width: number, height: number): void {
    const minorAlpha = 0.06;
    const majorAlpha = 0.12;
    const g = this.grid;
    g.clear();

    for (let x = 0; x <= width; x += GRID_SIZE) {
      const alpha = (x / GRID_SIZE) % 4 === 0 ? majorAlpha : minorAlpha;
      g.lineStyle(1, 0xffffff, alpha);
      g.moveTo(x, 0);
      g.lineTo(x, height);
    }

    for (let y = 0; y <= height; y += GRID_SIZE) {
      const alpha = (y / GRID_SIZE) % 4 === 0 ? majorAlpha : minorAlpha;
      g.lineStyle(1, 0xffffff, alpha);
      g.moveTo(0, y);
      g.lineTo(width, y);
    }
  }

  private buildFallbackSchema(type: string): NodeSchema {
    return {
      type,
      label: type,
      inputs: [{ name: 'input' }],
      outputs: [{ name: 'output' }]
    };
  }

  private updatePortConnectionState(nodeId: string, portName: string | undefined, direction: PortDirection): void {
    const view = this.nodeViews.get(nodeId);
    if (!view) {
      return;
    }
    const names = typeof portName === 'string'
      ? [portName]
      : view.listPorts(direction).map(port => port.name);
    if (!names.length) {
      return;
    }
    for (const name of names) {
      const connected = this.graph.listEdges().some(edge => {
        return direction === 'input'
          ? edge.to.nodeId === nodeId && this.isSamePort(edge.to.port, name)
          : edge.from.nodeId === nodeId && this.isSamePort(edge.from.port, name);
      });
      view.setPortConnectionState(direction, name, connected);
    }
  }

  private isTriggerConnection(edge: Edge): boolean {
    return (
      this.isTriggerPort(edge.from.nodeId, 'output', edge.from.port) ||
      this.isTriggerPort(edge.to.nodeId, 'input', edge.to.port)
    );
  }

  private isTriggerPort(nodeId: string, direction: PortDirection, portName?: string): boolean {
    const view = this.nodeViews.get(nodeId);
    if (!view) {
      return false;
    }
    return view.isTriggerPort(direction, portName ?? '');
  }
  private openVariableNodeCreator(operation: VariableMenuOperation, position: NodePosition): void {
    const variables = this.graph.listVariables();
    if (!variables.length) {
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert('请先在变量面板中创建变量。');
      }
      return;
    }

    this.closeVariablePicker();

    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(15, 23, 42, 0.55)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '40';

    const panel = document.createElement('div');
    panel.style.minWidth = '320px';
    panel.style.maxWidth = '420px';
    panel.style.background = 'rgba(15, 23, 42, 0.98)';
    panel.style.border = '1px solid rgba(148, 163, 184, 0.4)';
    panel.style.borderRadius = '14px';
    panel.style.padding = '20px';
    panel.style.color = '#e2e8f0';
    panel.style.boxShadow = '0 24px 48px rgba(15, 23, 42, 0.45)';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.gap = '12px';

    const title = document.createElement('div');
    const menuInfo = VARIABLE_MENU_TYPES.find(item => item.operation === operation);
    title.textContent = menuInfo ? menuInfo.label : '选择变量';
    title.style.fontSize = '16px';
    title.style.fontWeight = '600';

    const subtitle = document.createElement('div');
    subtitle.textContent = '请选择要使用的变量：';
    subtitle.style.fontSize = '13px';
    subtitle.style.color = '#94a3b8';

    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '8px';
    list.style.maxHeight = '280px';
    list.style.overflowY = 'auto';

    for (const variable of variables) {
      const item = document.createElement('button');
      item.type = 'button';
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.padding = '12px 14px';
      item.style.border = '1px solid rgba(148, 163, 184, 0.25)';
      item.style.borderRadius = '10px';
      item.style.background = 'rgba(30, 41, 59, 0.85)';
      item.style.color = '#e2e8f0';
      item.style.cursor = 'pointer';
      item.style.fontSize = '13px';
      item.style.gap = '12px';

      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(99, 102, 241, 0.32)';
        item.style.borderColor = 'rgba(99, 102, 241, 0.65)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'rgba(30, 41, 59, 0.85)';
        item.style.border = '1px solid rgba(148, 163, 184, 0.25)';
      });

      const name = document.createElement('span');
      name.textContent = variable.name;
      name.style.fontWeight = '500';

      const meta = document.createElement('span');
      meta.textContent = this.describeVariableMeta(variable);
      meta.style.fontSize = '12px';
      meta.style.color = '#94a3b8';

      item.appendChild(name);
      item.appendChild(meta);

      item.addEventListener('click', () => {
        this.createVariableOperationNode(operation, variable, position);
        this.closeVariablePicker();
      });

      list.appendChild(item);
    }

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'flex-end';

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = '取消';
    cancel.style.padding = '8px 16px';
    cancel.style.border = 'none';
    cancel.style.borderRadius = '8px';
    cancel.style.background = 'rgba(71, 85, 105, 0.65)';
    cancel.style.color = '#e2e8f0';
    cancel.style.cursor = 'pointer';
    cancel.addEventListener('click', () => this.closeVariablePicker());

    actions.appendChild(cancel);

    panel.appendChild(title);
    panel.appendChild(subtitle);
    panel.appendChild(list);
    panel.appendChild(actions);
    overlay.appendChild(panel);

    overlay.addEventListener('click', event => {
      if (event.target === overlay) {
        this.closeVariablePicker();
      }
    });

    this.container.appendChild(overlay);
    this.variablePickerOverlay = overlay;
  }

  private closeVariablePicker(): void {
    if (this.variablePickerOverlay) {
      this.variablePickerOverlay.remove();
      this.variablePickerOverlay = undefined;
    }
  }

  private createVariableOperationNode(operation: VariableMenuOperation, variable: EditorVariableState, position: NodePosition): void {
    const mapping = VARIABLE_NODE_TYPES[operation];
    const nodeType = mapping?.[variable.type];
    if (!nodeType) {
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(`暂不支持变量类型：${variable.type}。请改用数值变量。`);
      }
      return;
    }
    const config: Record<string, unknown> = {
      variableId: variable.id,
      variableName: variable.name,
      variableType: variable.type,
      defaultValue: variable.defaultValue
    };
    if (operation === 'init') {
      config.initialValue = variable.defaultValue;
    }
    if (operation === 'increment' || operation === 'decrement') {
      config.amount = 1;
    }
    this.addNode(nodeType, { position, config });
  }

  private describeVariableMeta(variable: EditorVariableState): string {
    const typeLabels: Record<EditorVariableType, string> = {
      string: '字符串',
      number: '数字',
      boolean: '布尔',
      array: '数组',
      object: '对象'
    };
    return `${typeLabels[variable.type]} · 默认值：${this.formatVariableValue(variable.defaultValue)}`;
  }

  private formatVariableValue(value: unknown): string {
    if (value === undefined || value === null) {
      return '无';
    }
    if (typeof value === 'string') {
      return value.length > 18 ? `${value.slice(0, 18)}…` : value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

}

function resolveContainer(target: HTMLElement | string): ResolvedContainer {
  if (typeof target !== 'string') {
    return {
      element: target,
      width: target.clientWidth,
      height: target.clientHeight
    };
  }
  const element = document.querySelector<HTMLElement>(target);
  if (!element) {
    throw new Error(`Unable to locate container element: ${target}`);
  }
  return {
    element,
    width: element.clientWidth,
    height: element.clientHeight
  };
}

function supportsAsyncInit(AppCtor: typeof Application): boolean {
  return typeof (AppCtor.prototype as unknown as { init?: unknown }).init === 'function';
}

async function createAsyncApplication(width: number, height: number, background: number): Promise<Application> {
  const app = new Application();
  await (app as unknown as { init: (options: { width: number; height: number; background: number; antialias: boolean }) => Promise<void> }).init({
    width,
    height,
    background,
    antialias: true
  });
  return app;
}

function createSyncApplication(width: number, height: number, background: number): Application {
  return new Application({
    width,
    height,
    background,
    antialias: true
  });
}
