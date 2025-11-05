type EventListener<Payload> = (payload: Payload) => void;

type EventMap = Record<string, unknown>;

export class EventEmitter<Events extends EventMap> {
  private readonly listeners = new Map<keyof Events, Set<EventListener<Events[keyof Events]>>>();

  on<K extends keyof Events>(event: K, listener: EventListener<Events[K]>): void {
    const existing = this.listeners.get(event);
    if (existing) {
      existing.add(listener as EventListener<Events[keyof Events]>);
    } else {
      this.listeners.set(event, new Set([listener as EventListener<Events[keyof Events]>]));
    }
  }

  off<K extends keyof Events>(event: K, listener: EventListener<Events[K]>): void {
    const existing = this.listeners.get(event);
    if (!existing) {
      return;
    }
    existing.delete(listener as EventListener<Events[keyof Events]>);
    if (!existing.size) {
      this.listeners.delete(event);
    }
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const existing = this.listeners.get(event);
    if (!existing) {
      return;
    }
    for (const listener of existing) {
      (listener as EventListener<Events[K]>)(payload);
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
