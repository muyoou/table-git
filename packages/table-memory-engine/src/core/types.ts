export type ConversationRole = 'user' | 'assistant' | 'system' | 'tool';

export interface ConversationTurn {
  id: string;
  role: ConversationRole;
  content: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface TagInstruction {
  tag: string;
  action: string;
  target?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  confidence?: number;
  raw?: string;
}

export interface FlowContext {
  conversation: ConversationTurn[];
  sheetId?: string;
  services: Record<string, unknown>;
  event?: Record<string, unknown>;
}

export interface NodeResult {
  outputs?: Record<string, unknown>;
  warnings?: string[];
  events?: Array<{ event: string; payload?: unknown }>;
  repeat?: boolean;
}
