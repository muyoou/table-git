/**
 * Supabase Database Types
 * 
 * Generated types for the database schema
 */

export interface Database {
  public: {
    Tables: {
      templates: {
        Row: Template;
        Insert: Omit<Template, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Template, 'id' | 'created_at'>>;
      };
      conversations: {
        Row: Conversation;
        Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Conversation, 'id' | 'created_at'>>;
      };
      flows: {
        Row: Flow;
        Insert: Omit<Flow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Flow, 'id' | 'created_at'>>;
      };
      global_flows: {
        Row: GlobalFlow;
        Insert: Omit<GlobalFlow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<GlobalFlow, 'id' | 'created_at'>>;
      };
      market_items: {
        Row: MarketItem;
        Insert: Omit<MarketItem, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MarketItem, 'id' | 'created_at'>>;
      };
      conversation_messages: {
        Row: ConversationMessage;
        Insert: Omit<ConversationMessage, 'id' | 'created_at'>;
        Update: Partial<Omit<ConversationMessage, 'id' | 'created_at'>>;
      };
    };
  };
}

// Template: combines table repository + node editor flows
export interface Template {
  id: string;
  name: string;
  description?: string;
  // Serialized TableGit repository state (stored as JSONB, accessed as object)
  repository_state: unknown;
  // Repository metadata
  repository_metadata: Record<string, unknown>;
  // IDs of associated flows
  flow_ids: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Conversation: instance of a template with actual table state and messages
export interface Conversation {
  id: string;
  name: string;
  template_id: string;
  // Current state of the table (TableGit serialized state, stored as JSONB)
  current_state: unknown;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Flow: node editor workflow definition
export interface Flow {
  id: string;
  name: string;
  description?: string;
  // Serialized workflow from WorkflowSerializer (stored as JSONB, accessed as object)
  workflow_data: unknown;
  // Optional template ID if this flow belongs to a template
  template_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Global Flow: flows that run across all conversations
export interface GlobalFlow {
  id: string;
  name: string;
  description?: string;
  workflow_data: unknown;
  enabled: boolean;
  priority: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Market Item: public repository/flow for sharing
export interface MarketItem {
  id: string;
  name: string;
  description: string;
  // Type of market item
  item_type: 'repository' | 'flow' | 'hybrid';
  // Access permissions
  access_type: 'clone_only' | 'merge_only' | 'both';
  // Tags for categorization
  tags: string[];
  // README content in markdown
  readme: string;
  // License/usage declaration
  license: string;
  // For repository type: serialized state (stored as JSONB)
  repository_state?: unknown;
  repository_metadata?: Record<string, unknown>;
  // For flow type: serialized workflow (stored as JSONB)
  workflow_data?: unknown;
  // For hybrid type: both
  // Stats
  clone_count: number;
  merge_count: number;
  view_count: number;
  // Publisher info
  publisher_id: string;
  created_at: string;
  updated_at: string;
}

// Conversation Message: messages in a conversation
export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  // Optional: changes made by this message (for AI messages)
  changes?: Record<string, unknown>;
  created_at: string;
}
