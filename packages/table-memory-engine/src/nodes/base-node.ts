import type { EventBus } from '../core/event-bus';
import type { FormatterRegistry } from '../core/formatter';
import type { TableAdapter } from '../core/table-adapter';
import type { TagParser } from '../core/tag-parser';
import type { FlowContext, NodeResult } from '../core/types';
import type { GraphDefinition, NodeInstance } from '../runtime/graph-types';

export interface NodeServices {
  adapter: TableAdapter;
  parser: TagParser;
  formatters: FormatterRegistry;
  events: EventBus;
  log?: (message: string, extras?: Record<string, unknown>) => void;
  [key: string]: unknown;
}

export interface NodeExecutionContext {
  graph: GraphDefinition;
  node: NodeInstance;
  flowContext: FlowContext;
  services: NodeServices;
  state: Map<string, unknown>;
  inputs: Record<string, unknown>;
}

export interface RuntimeNode {
  readonly type: string;
  getSchema(): import('../runtime/graph-types').NodeSchema;
  validate?(config: Record<string, unknown>): void;
  execute(context: NodeExecutionContext): Promise<NodeResult | void>;
}
