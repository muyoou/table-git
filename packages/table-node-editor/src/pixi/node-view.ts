import { Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js';
import type { EditorNode, PortDirection } from '../types';
import type { NodeSchema, PortDefinition } from '@table-git/memory-engine';
import { PortView } from './port-view';
import type { NodePosition } from '../types';

export interface NodeViewOptions {
  node: EditorNode;
  schema: NodeSchema;
  onDrag: (nodeId: string, position: NodePosition) => void;
  onDoubleClick: (nodeId: string) => void;
  onPortPointerDown: (nodeId: string, portName: string, direction: PortDirection, event: FederatedPointerEvent) => void;
  onPortPointerUp: (nodeId: string, portName: string, direction: PortDirection, event: FederatedPointerEvent) => void;
  onInputValueEdit: (nodeId: string, portName: string, anchor: { x: number; y: number }) => void;
}

const NODE_WIDTH = 240;
const HEADER_HEIGHT = 36;
const PORT_VERTICAL_SPACING = 56;
const BODY_PADDING = 12;

interface NodeTheme {
  header: number;
  body: number;
  border: number;
  optional: number;
}

const DEFAULT_THEME: NodeTheme = {
  header: 0x312e81,
  body: 0x1f2937,
  border: 0x6366f1,
  optional: 0xfbbf24
};

const EVENT_THEME: NodeTheme = {
  header: 0x5b21b6,
  body: 0x2d0f6f,
  border: 0xc084fc,
  optional: 0xd8b4fe
};
const INPUT_VALUE_BOX_X = 20;
const INPUT_VALUE_BOX_HEIGHT = 24;
const INPUT_VALUE_BOX_WIDTH = Math.floor(NODE_WIDTH / 2) - BODY_PADDING;
const INPUT_VALUE_BOX_OFFSET = 18;

interface InputValueBox {
  container: Container;
  background: Graphics;
  text: Text;
}

export class NodeView extends Container {
  readonly nodeId: string;

  private readonly background: Graphics;
  private readonly header: Graphics;
  private readonly title: Text;
  private readonly summary: Text;
  private readonly inputContainer: Container;
  private readonly outputContainer: Container;
  private dragging = false;
  private dragOffset = { x: 0, y: 0 };
  private readonly inputPorts = new Map<string, PortView>();
  private readonly outputPorts = new Map<string, PortView>();
  private readonly options: NodeViewOptions;
  private currentNode: EditorNode;
  private readonly triggerPorts = new Map<string, Set<string>>();
  private readonly inputValueBoxes = new Map<string, InputValueBox>();
  private readonly theme: NodeTheme;
  private readonly isEventTheme: boolean;
  private readonly schema: NodeSchema;

  constructor(options: NodeViewOptions) {
    super();
    this.options = options;
    this.nodeId = options.node.id;
    this.currentNode = { ...options.node, config: { ...options.node.config } };
    this.schema = options.schema;
    this.triggerPorts.set('input', new Set());
    this.triggerPorts.set('output', new Set());
    this.x = options.node.position.x;
    this.y = options.node.position.y;
  this.theme = this.resolveTheme(options.schema);
  this.isEventTheme = this.theme === EVENT_THEME;

    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.background = new Graphics();
    this.header = new Graphics();
    this.title = new Text(this.resolveTitle(), {
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xf9fafb,
      fontWeight: 'bold'
    });
    this.summary = new Text('', {
      fontFamily: 'Arial',
      fontSize: 11,
      fill: 0xd1d5db,
      wordWrap: true,
      wordWrapWidth: NODE_WIDTH - BODY_PADDING * 2
    });

    this.inputContainer = new Container();
    this.outputContainer = new Container();

    this.addChild(this.background);
    this.addChild(this.header);
    this.addChild(this.title);
    this.addChild(this.summary);
    this.addChild(this.inputContainer);
    this.addChild(this.outputContainer);

    this.summary.text = this.schema.summary ?? '';
    this.layout();
    this.setupInteractions();
  }

  updatePosition(position: NodePosition): void {
    this.x = position.x;
    this.y = position.y;
    this.currentNode = { ...this.currentNode, position };
  }

  updateConfig(config: Record<string, unknown>): void {
    this.currentNode = { ...this.currentNode, config };
    this.title.text = this.resolveTitle();
    this.layout();
    for (const [portName] of this.inputValueBoxes) {
      this.updateInputValue(portName, config[portName as keyof typeof config]);
    }
  }

  getPort(direction: PortDirection, name: string): PortView | undefined {
    const ports = direction === 'input' ? this.inputPorts : this.outputPorts;
    return ports.get(name);
  }

  listPorts(direction: PortDirection): PortView[] {
    const ports = direction === 'input' ? this.inputPorts : this.outputPorts;
    return [...ports.values()];
  }

  isTriggerPort(direction: PortDirection, name?: string): boolean {
    const key = direction === 'input' ? 'input' : 'output';
    const set = this.triggerPorts.get(key);
    if (!set) {
      return false;
    }
    if (!name) {
      return set.size > 0;
    }
    return set.has(name);
  }

  private layout(): void {
  const inputs = this.withFallbackPorts(this.schema.inputs, 'input');
  const outputs = this.withFallbackPorts(this.schema.outputs, 'output');

  this.triggerPorts.set('input', new Set(inputs.filter(def => this.isTriggerDefinition(def)).map(def => def.name)));
  this.triggerPorts.set('output', new Set(outputs.filter(def => this.isTriggerDefinition(def)).map(def => def.name)));

    const portRows = Math.max(inputs.length, outputs.length);
    const portAreaHeight = portRows * PORT_VERTICAL_SPACING;

    this.background.clear();
  this.background.lineStyle(1, this.theme.border, 0.85);
  this.background.beginFill(this.theme.body);

    const portsTop = HEADER_HEIGHT + BODY_PADDING;
    const portsBottom = portsTop + portAreaHeight;
    const hasSummary = (this.summary.text?.length ?? 0) > 0;
  const summaryTop = portsBottom + (hasSummary ? BODY_PADDING : 0);
    const summaryHeight = hasSummary ? this.summary.height : 0;
    const summaryBottom = summaryTop + summaryHeight;
    const contentBottom = hasSummary ? summaryBottom : portsBottom;
    const totalHeight = Math.max(contentBottom + BODY_PADDING, HEADER_HEIGHT + BODY_PADDING * 2);

    this.background.drawRoundedRect(0, 0, NODE_WIDTH, totalHeight, 12);
    this.background.endFill();

    this.header.clear();
  this.header.beginFill(this.theme.header);
    this.header.drawRoundedRect(0, 0, NODE_WIDTH, HEADER_HEIGHT, { tl: 12, tr: 12, br: 0, bl: 0 });
    this.header.endFill();

    this.title.x = BODY_PADDING;
    this.title.y = HEADER_HEIGHT / 2 - this.title.height / 2;

  this.summary.visible = hasSummary;
  this.summary.x = BODY_PADDING;
  this.summary.y = summaryTop;

    this.inputContainer.x = 0;
    this.inputContainer.y = portsTop;

    this.outputContainer.x = NODE_WIDTH;
    this.outputContainer.y = portsTop;

    this.populatePorts(inputs, this.inputContainer, this.inputPorts, 'input');
    this.populatePorts(outputs, this.outputContainer, this.outputPorts, 'output');
  }

  private populatePorts(definitions: PortDefinition[], container: Container, registry: Map<string, PortView>, direction: PortDirection): void {
    registry.clear();
    container.removeChildren();
    if (direction === 'input') {
      this.inputValueBoxes.clear();
    }

    definitions.forEach((definition, index) => {
      const y = index * PORT_VERTICAL_SPACING;
      const label = this.formatPortName(definition);
      const typeLabel = this.formatPortType(definition);
      const portColor = this.resolvePortColor(definition) ?? (this.isEventTheme ? this.theme.border : undefined);
      const port = new PortView({
        name: definition.name,
        label,
        typeLabel,
        direction,
        y,
        color: portColor,
        isTrigger: this.isTriggerDefinition(definition),
        onPointerDown: (p, event) => this.options.onPortPointerDown(this.nodeId, p.name, direction, event),
        onPointerUp: (p, event) => this.options.onPortPointerUp(this.nodeId, p.name, direction, event)
      });

      if (direction === 'output') {
        port.x = -12;
      } else {
        port.x = 12;
      }

      container.addChild(port);
      registry.set(definition.name, port);

      if (direction === 'input' && this.isValueEditable(definition)) {
        this.createInputValueBox(definition, y);
      }
    });
  }

  private setupInteractions(): void {
    this.on('pointerdown', (event: FederatedPointerEvent) => {
      this.dragging = true;
      const global = event.global;
      this.dragOffset = { x: global.x - this.x, y: global.y - this.y };
    });

    const stopDragging = () => {
      this.dragging = false;
    };

    this.on('pointerup', stopDragging);
    this.on('pointerupoutside', stopDragging);

    this.on('pointermove', (event: FederatedPointerEvent) => {
      if (!this.dragging) {
        return;
      }
      const global = event.global;
      const nextPosition = { x: global.x - this.dragOffset.x, y: global.y - this.dragOffset.y };
      this.options.onDrag(this.nodeId, nextPosition);
    });

    this.on('pointertap', (event: FederatedPointerEvent) => {
      if (event.detail === 2) {
        this.options.onDoubleClick(this.nodeId);
      }
    });
  }

  setPortConnectionState(direction: PortDirection, portName: string, connected: boolean): void {
    const ports = direction === 'input' ? this.inputPorts : this.outputPorts;
    const port = ports.get(portName);
    port?.setConnected(connected);

    if (direction === 'input') {
      const box = this.inputValueBoxes.get(portName);
      if (box) {
        box.container.visible = !connected;
      }
    }
  }

  private createInputValueBox(definition: PortDefinition, portY: number): void {
    const container = new Container();
    container.x = INPUT_VALUE_BOX_X;
    container.y = portY + INPUT_VALUE_BOX_OFFSET;
    container.eventMode = 'static';
    container.cursor = 'pointer';

    const background = new Graphics();
    this.drawInputValueBackground(background, false);

    const text = new Text('', {
      fontFamily: 'Arial',
      fontSize: 11,
      fill: 0xf8fafc
    });
    text.x = 8;
    text.y = 4;

    container.addChild(background);
    container.addChild(text);

    container.on('pointerdown', (event: FederatedPointerEvent) => {
      this.stopPointerPropagation(event);
    });
    container.on('pointertap', (event: FederatedPointerEvent) => {
      this.stopPointerPropagation(event);
      this.options.onInputValueEdit(this.nodeId, definition.name, { x: event.global.x, y: event.global.y });
    });

    this.inputContainer.addChild(container);
    this.inputValueBoxes.set(definition.name, { container, background, text });
    const value = this.currentNode.config?.[definition.name as keyof typeof this.currentNode.config];
    this.updateInputValue(definition.name, value);
  }

  private updateInputValue(portName: string, value: unknown): void {
    const box = this.inputValueBoxes.get(portName);
    if (!box) {
      return;
    }

  const formatted = this.formatInputValue(value);
  box.text.text = formatted.text;
  box.text.alpha = formatted.alpha;
  const mutableStyle = box.text.style as unknown as { fill?: unknown };
  mutableStyle.fill = formatted.color;
  this.drawInputValueBackground(box.background, formatted.isActive);
  }

  private drawInputValueBackground(target: Graphics, isActive: boolean): void {
    target.clear();
    target.lineStyle(1, isActive ? 0x6366f1 : 0x475569, isActive ? 0.9 : 0.6);
    target.beginFill(isActive ? 0x312e81 : 0x1e293b, 0.95);
    target.drawRoundedRect(0, 0, INPUT_VALUE_BOX_WIDTH, INPUT_VALUE_BOX_HEIGHT, 6);
    target.endFill();
  }

  private formatInputValue(value: unknown): { text: string; color: number; alpha: number; isActive: boolean } {
    if (typeof value === 'undefined') {
      return {
        text: '未设置',
        color: 0x94a3b8,
        alpha: 0.85,
        isActive: false
      };
    }

    if (value === null) {
      return {
        text: 'null',
        color: 0xf8fafc,
        alpha: 1,
        isActive: true
      };
    }

    let text: string;
    if (typeof value === 'string') {
      text = value;
    } else {
      try {
        text = JSON.stringify(value);
      } catch {
        text = String(value);
      }
    }

    if (text.length > 24) {
      text = `${text.slice(0, 21)}…`;
    }

    return {
      text,
      color: 0xf8fafc,
      alpha: 1,
      isActive: true
    };
  }



  private withFallbackPorts(definitions: PortDefinition[] | undefined, fallbackName: string): PortDefinition[] {
    if (Array.isArray(definitions)) {
      return definitions.map(definition => ({ ...definition }));
    }
    return [{ name: fallbackName }];
  }

  private formatPortName(definition: PortDefinition): string {
    const base = definition.label ?? definition.name;
    const namePart = definition.required === false ? `${base}?` : base;
    return namePart;
  }

  private formatPortType(definition: PortDefinition): string | undefined {
    return definition.type;
  }

  private resolvePortColor(definition: PortDefinition): number | undefined {
    if (definition.required === false) {
      return this.theme.optional;
    }
    return undefined;
  }

  private isTriggerDefinition(definition: PortDefinition): boolean {
    return (definition.type ?? '').toLowerCase() === 'flowevent'.toLowerCase();
  }

  private isValueEditable(definition: PortDefinition): boolean {
    return !this.isTriggerDefinition(definition);
  }

  private stopPointerPropagation(event: FederatedPointerEvent): void {
    const hooks = event as unknown as { stopPropagation?: () => void; stopImmediatePropagation?: () => void; preventDefault?: () => void };
    hooks.stopImmediatePropagation?.();
    hooks.stopPropagation?.();
    hooks.preventDefault?.();
  }

  private resolveTheme(schema: NodeSchema): NodeTheme {
    const hintTheme = typeof schema.uiHints?.theme === 'string' ? schema.uiHints.theme : undefined;
    if (schema.category === 'event' || hintTheme === 'event') {
      return EVENT_THEME;
    }
    return DEFAULT_THEME;
  }

  private resolveTitle(): string {
    const baseLabel = this.schema.label ?? this.currentNode.type;
    if (this.schema.category === 'variables') {
      const variableName = typeof this.currentNode.config?.variableName === 'string' ? this.currentNode.config.variableName : '';
      if (variableName) {
        return `${baseLabel}：${variableName}`;
      }
    }
    return baseLabel;
  }
}
