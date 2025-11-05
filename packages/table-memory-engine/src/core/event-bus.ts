export type MemoryEngineEvent =
  | 'beforeLoad'
  | 'afterLoad'
  | 'beforeNode'
  | 'afterNode'
  | 'beforeApply'
  | 'afterApply'
  | 'conflict'
  | 'error';

export interface EventPayload {
  nodeId?: string;
  nodeType?: string;
  sheetId?: string;
  data?: Record<string, unknown>;
  error?: unknown;
}

export type EventHandler<TPayload extends EventPayload = EventPayload> = (payload: TPayload) => void | Promise<void>;

export class EventBus {
  private readonly handlers = new Map<MemoryEngineEvent, Set<EventHandler>>();

  on<TPayload extends EventPayload = EventPayload>(event: MemoryEngineEvent, handler: EventHandler<TPayload>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as EventHandler);
  }

  off<TPayload extends EventPayload = EventPayload>(event: MemoryEngineEvent, handler: EventHandler<TPayload>): void {
    this.handlers.get(event)?.delete(handler as EventHandler);
  }

  async emit(event: MemoryEngineEvent, payload: EventPayload = {}): Promise<void> {
    const handlers = this.handlers.get(event);
    if (!handlers) {
      return;
    }
    for (const handler of handlers) {
      await handler(payload);
    }
  }
}
