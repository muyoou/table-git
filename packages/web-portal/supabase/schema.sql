-- Supabase Database Schema for Table-Git Web Portal
-- This file contains the database schema definitions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  repository_state JSONB NOT NULL,
  repository_metadata JSONB DEFAULT '{}',
  flow_ids TEXT[] DEFAULT '{}',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  current_state JSONB NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flows table
CREATE TABLE IF NOT EXISTS flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  workflow_data JSONB NOT NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Global flows table
CREATE TABLE IF NOT EXISTS global_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  workflow_data JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market items table
CREATE TABLE IF NOT EXISTS market_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('repository', 'flow', 'hybrid')),
  access_type TEXT NOT NULL CHECK (access_type IN ('clone_only', 'merge_only', 'both')),
  tags TEXT[] DEFAULT '{}',
  readme TEXT NOT NULL,
  license TEXT NOT NULL,
  repository_state JSONB,
  repository_metadata JSONB,
  workflow_data JSONB,
  clone_count INTEGER DEFAULT 0,
  merge_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  publisher_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation messages table
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_template_id ON conversations(template_id);
CREATE INDEX IF NOT EXISTS idx_flows_user_id ON flows(user_id);
CREATE INDEX IF NOT EXISTS idx_flows_template_id ON flows(template_id);
CREATE INDEX IF NOT EXISTS idx_global_flows_user_id ON global_flows(user_id);
CREATE INDEX IF NOT EXISTS idx_global_flows_enabled ON global_flows(enabled);
CREATE INDEX IF NOT EXISTS idx_market_items_item_type ON market_items(item_type);
CREATE INDEX IF NOT EXISTS idx_market_items_tags ON market_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flows_updated_at
  BEFORE UPDATE ON flows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_global_flows_updated_at
  BEFORE UPDATE ON global_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_items_updated_at
  BEFORE UPDATE ON market_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- Templates policies
CREATE POLICY "Users can view their own templates"
  ON templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON templates FOR DELETE
  USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Flows policies
CREATE POLICY "Users can view their own flows"
  ON flows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flows"
  ON flows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flows"
  ON flows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flows"
  ON flows FOR DELETE
  USING (auth.uid() = user_id);

-- Global flows policies
CREATE POLICY "Users can view their own global flows"
  ON global_flows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own global flows"
  ON global_flows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own global flows"
  ON global_flows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own global flows"
  ON global_flows FOR DELETE
  USING (auth.uid() = user_id);

-- Market items policies (public read, owner write)
CREATE POLICY "Anyone can view market items"
  ON market_items FOR SELECT
  USING (true);

CREATE POLICY "Users can create market items"
  ON market_items FOR INSERT
  WITH CHECK (auth.uid() = publisher_id);

CREATE POLICY "Publishers can update their market items"
  ON market_items FOR UPDATE
  USING (auth.uid() = publisher_id);

CREATE POLICY "Publishers can delete their market items"
  ON market_items FOR DELETE
  USING (auth.uid() = publisher_id);

-- Conversation messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON conversation_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON conversation_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Function to increment market item stats
CREATE OR REPLACE FUNCTION increment_market_stat(
  item_id UUID,
  stat_name TEXT
)
RETURNS VOID AS $$
BEGIN
  IF stat_name = 'clone_count' THEN
    UPDATE market_items SET clone_count = clone_count + 1 WHERE id = item_id;
  ELSIF stat_name = 'merge_count' THEN
    UPDATE market_items SET merge_count = merge_count + 1 WHERE id = item_id;
  ELSIF stat_name = 'view_count' THEN
    UPDATE market_items SET view_count = view_count + 1 WHERE id = item_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
