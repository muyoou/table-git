import type { ConversationTurn, FlowContext } from '../core/types';

export type MemoryEventType = 'table:init' | 'ai:reply' | 'user:message' | string;

export interface MemoryEvent {
  id: string;
  type: MemoryEventType;
  timestamp?: string;
  actor?: string;
  sheetId?: string;
  conversation?: ConversationTurn[];
  payload?: Record<string, unknown>;
  services?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface DispatchResult {
  event: MemoryEvent;
  flowContext: FlowContext;
  state: Map<string, unknown>;
}
