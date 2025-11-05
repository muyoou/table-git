import type { FlowContext } from '../core/types';
import type { NodeRuntime, RunOptions } from './node-runtime';
import type { GraphDefinition } from './graph-types';
import type { MemoryEvent, MemoryEventType, DispatchResult } from './memory-events';

export interface EventFlowResolver {
  graph: GraphDefinition | (() => GraphDefinition);
  createContext?: (event: MemoryEvent) => FlowContext;
  createRunOptions?: (event: MemoryEvent) => RunOptions | undefined;
  afterRun?: (result: DispatchResult) => void | Promise<void>;
}

interface RegisteredFlow extends EventFlowResolver {
  graph: GraphDefinition;
}

export class MemoryWorkflowEngine {
  private readonly flows = new Map<MemoryEventType, EventFlowResolver>();
  private readonly runtime: NodeRuntime;

  constructor(runtime: NodeRuntime) {
    this.runtime = runtime;
  }

  register(eventType: MemoryEventType, resolver: EventFlowResolver): void {
    this.flows.set(eventType, resolver);
  }

  unregister(eventType: MemoryEventType): void {
    this.flows.delete(eventType);
  }

  has(eventType: MemoryEventType): boolean {
    return this.flows.has(eventType);
  }

  async dispatch(event: MemoryEvent): Promise<DispatchResult> {
    const resolver = this.flows.get(event.type) ?? this.flows.get('*');
    if (!resolver) {
      throw new Error(`No workflow registered for event type '${event.type}'.`);
    }

    const registered = this.ensureGraph(resolver);
    const flowContext = resolver.createContext ? resolver.createContext(event) : this.createDefaultContext(event);
    const runOptions = resolver.createRunOptions ? resolver.createRunOptions(event) : undefined;

    const result = await this.runtime.run(registered.graph, flowContext, runOptions);
    const dispatchResult: DispatchResult = {
      event,
      flowContext: result.context,
      state: result.state
    };

    if (resolver.afterRun) {
      await resolver.afterRun(dispatchResult);
    }

    return dispatchResult;
  }

  private ensureGraph(resolver: EventFlowResolver): RegisteredFlow {
    if (typeof resolver.graph === 'function') {
      const graph = resolver.graph();
      return { ...resolver, graph };
    }
    return { ...resolver, graph: resolver.graph };
  }

  private createDefaultContext(event: MemoryEvent): FlowContext {
    return {
      conversation: event.conversation ?? [],
      sheetId: event.sheetId,
      services: event.services ?? {},
      event: {
        id: event.id,
        type: event.type,
        timestamp: event.timestamp,
        actor: event.actor,
        payload: event.payload,
        context: event.context
      }
    };
  }
}
