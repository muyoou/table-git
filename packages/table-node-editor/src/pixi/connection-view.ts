import { FederatedPointerEvent, Graphics, PointData } from 'pixi.js';

export interface ConnectionViewOptions {
  id: string;
  onRequestRemove: (id: string) => void;
}

const LINE_COLOR = 0x38bdf8;
const LINE_WIDTH = 3;
const TRIGGER_LINE_COLOR = 0xffffff;
const TRIGGER_LINE_WIDTH = 3;

export class ConnectionView extends Graphics {
  private readonly id: string;
  private readonly options: ConnectionViewOptions;
  private isTrigger = false;

  constructor(options: ConnectionViewOptions) {
    super();
    this.id = options.id;
    this.options = options;

    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerover', () => {
      this.alpha = 0.85;
    });
    this.on('pointerout', () => {
      this.alpha = 1;
    });
    this.on('pointertap', (event: FederatedPointerEvent) => {
      if (event.detail === 2 || event.button === 2) {
        this.options.onRequestRemove(this.id);
      }
    });
    this.on('rightdown', () => this.options.onRequestRemove(this.id));
  }

  redraw(start: PointData, end: PointData, options?: { trigger?: boolean }): void {
    this.isTrigger = options?.trigger ?? this.isTrigger;
    const cpOffset = Math.max(Math.abs(end.x - start.x) / 2, 80);
    const controlX1 = start.x + cpOffset;
    const controlY1 = start.y;
    const controlX2 = end.x - cpOffset;
    const controlY2 = end.y;

    this.clear();
    const color = this.isTrigger ? TRIGGER_LINE_COLOR : LINE_COLOR;
    const width = this.isTrigger ? TRIGGER_LINE_WIDTH : LINE_WIDTH;
    this.lineStyle(width, color, 1);
    this.moveTo(start.x, start.y);
    this.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, end.x, end.y);
  }
}
