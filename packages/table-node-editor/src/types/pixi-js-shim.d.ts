declare module 'pixi.js' {
  export type PointData = { x: number; y: number };

  export interface FederatedPointerEvent {
    global: PointData;
    detail: number;
    button: number;
    buttons: number;
    originalEvent?: Event;
  }

  export interface ApplicationInitOptions {
    width?: number;
    height?: number;
    background?: number | string;
    backgroundAlpha?: number;
    antialias?: boolean;
    resolution?: number;
    autoDensity?: boolean;
  }

  export class EventEmitter<T = any> {
    on(event: string, fn: (...args: any[]) => void): this;
    off(event: string, fn: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): boolean;
  }

  export class DisplayObject extends EventEmitter {
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
  alpha: number;
    eventMode?: 'none' | 'passive' | 'auto' | 'dynamic' | 'static';
    cursor?: string;
    interactive?: boolean;
    parent?: Container;
    getGlobalPosition(): PointData;
    destroy(removeChildren?: boolean): void;
  }

  export class Container<T extends DisplayObject = DisplayObject> extends DisplayObject {
    addChild<U extends DisplayObject[]>(...children: U): U[0];
    removeChild<U extends DisplayObject[]>(...children: U): U[0];
    removeChildren(): void;
    getChildAt(index: number): DisplayObject;
    hitArea?: any;
  }

  export class Graphics extends Container {
    clear(): this;
    lineStyle(width?: number, color?: number, alpha?: number, alignment?: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    bezierCurveTo(cpX: number, cpY: number, cpX2: number, cpY2: number, toX: number, toY: number): this;
    beginFill(color?: number, alpha?: number): this;
  drawRoundedRect(x: number, y: number, width: number, height: number, radius?: number | number[] | { tl?: number; tr?: number; br?: number; bl?: number }): this;
    drawCircle(x: number, y: number, radius: number): this;
    endFill(): this;
    tint: number;
  }

  export class TextStyle {
    constructor(style: Record<string, unknown>);
  }

  export class Text extends Container {
    constructor(text: string, style?: Partial<Record<string, unknown>>);
    text: string;
    style: TextStyle;
  }

  export class Ticker {
    add(fn: (delta: number) => void): void;
    remove(fn: (delta: number) => void): void;
  }

  export class Application {
    constructor(options?: ApplicationInitOptions);
    stage: Container;
    ticker: Ticker;
    canvas?: HTMLCanvasElement;
    view?: HTMLCanvasElement;
    renderer: { resize(width: number, height: number): void; screen?: Rectangle };
    init?(options?: ApplicationInitOptions): Promise<void>;
    destroy(removeView?: boolean, stageOptions?: { children?: boolean }): void;
  }

  export const Rectangle: {
    new (x: number, y: number, width: number, height: number): any;
  };
}
