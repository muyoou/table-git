import { Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js';
import type { PortDirection } from '../types';

export interface PortViewOptions {
  name: string;
  direction: PortDirection;
  label?: string;
  typeLabel?: string;
  y: number;
  color?: number;
  isTrigger?: boolean;
  onPointerDown: (port: PortView, event: FederatedPointerEvent) => void;
  onPointerUp: (port: PortView, event: FederatedPointerEvent) => void;
}

const DEFAULT_PORT_RADIUS = 6;
const DEFAULT_PORT_COLOR = 0x4f46e5;
const HOVER_PORT_COLOR = 0x6366f1;
const CONNECTED_PORT_COLOR = 0x22c55e;

export class PortView extends Container {
  readonly name: string;
  readonly direction: PortDirection;
  readonly isTrigger: boolean;

  private readonly circle: Graphics;
  private readonly nameText: Text;
  private readonly typeText?: Text;
  private readonly options: PortViewOptions;
  private connected = false;
  private readonly radius = DEFAULT_PORT_RADIUS;

  constructor(options: PortViewOptions) {
    super();
    this.options = options;
    this.name = options.name;
    this.direction = options.direction;
    this.isTrigger = options.isTrigger ?? false;

    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.circle = new Graphics();
    this.applyColor();
    this.circle.eventMode = 'static';

    this.nameText = new Text(options.label ?? options.name, {
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xf9fafb
    });

    if (options.typeLabel) {
      this.typeText = new Text(options.typeLabel, {
        fontFamily: 'Arial',
        fontSize: 10,
        fill: 0x9ca3af
      });
    }

    this.layoutText();

    if (this.typeText) {
      this.addChild(this.circle, this.nameText, this.typeText);
    } else {
      this.addChild(this.circle, this.nameText);
    }
    this.y = options.y;

    this.on('pointerover', () => this.setHover(true));
    this.on('pointerout', () => this.setHover(false));
    this.on('pointerdown', (event: FederatedPointerEvent) => {
      this.stopEventPropagation(event);
      options.onPointerDown(this, event);
    });
    this.on('pointerup', (event: FederatedPointerEvent) => {
      this.stopEventPropagation(event);
      options.onPointerUp(this, event);
    });
  }

  setConnected(connected: boolean): void {
    this.connected = connected;
    this.applyColor();
  }

  setHover(hover: boolean): void {
    if (hover) {
      this.drawCircle(HOVER_PORT_COLOR);
    } else {
      this.applyColor();
    }
  }

  getAnchorPosition(): { x: number; y: number } {
    const global = this.getGlobalPosition();
    return { x: global.x, y: global.y };
  }

  private applyColor(): void {
  const baseColor = this.isTrigger ? 0xffffff : (this.options.color ?? DEFAULT_PORT_COLOR);
    const color = this.connected && !this.isTrigger ? CONNECTED_PORT_COLOR : baseColor;
    this.drawCircle(color);
  }

  private drawCircle(color: number): void {
    this.circle.clear();
    this.circle.beginFill(color);
    if (this.isTrigger) {
      this.circle.moveTo(0, -this.radius);
      this.circle.lineTo(this.radius, 0);
      this.circle.lineTo(0, this.radius);
      this.circle.lineTo(-this.radius, 0);
      this.circle.lineTo(0, -this.radius);
      this.circle.endFill();
      return;
    }
    this.circle.drawCircle(0, 0, this.radius);
    this.circle.endFill();
  }

  private layoutText(): void {
    const texts: Text[] = [this.nameText];
    if (this.typeText) {
      texts.push(this.typeText);
    }

    const isOutput = this.direction === 'output';
    const xOffset = isOutput ? -12 : 12;

    this.nameText.x = isOutput ? xOffset - this.nameText.width : xOffset;
    if (this.typeText) {
      this.typeText.x = isOutput ? xOffset - this.typeText.width : xOffset;
    }

    const lineSpacing = this.typeText ? 2 : 0;
    const totalHeight = texts.reduce((height, text) => height + text.height, 0) + (texts.length > 1 ? lineSpacing : 0);
    let currentY = -totalHeight / 2;

    this.nameText.y = currentY;
    currentY += this.nameText.height + lineSpacing;

    if (this.typeText) {
      this.typeText.y = currentY;
    }
  }

  private stopEventPropagation(event: FederatedPointerEvent): void {
    const hooks = event as unknown as { stopPropagation?: () => void; stopImmediatePropagation?: () => void; preventDefault?: () => void };
    if (typeof hooks.stopImmediatePropagation === 'function') {
      hooks.stopImmediatePropagation.call(event);
    } else if (typeof hooks.stopPropagation === 'function') {
      hooks.stopPropagation.call(event);
    }
    if (typeof hooks.preventDefault === 'function') {
      hooks.preventDefault.call(event);
    }
  }
}
