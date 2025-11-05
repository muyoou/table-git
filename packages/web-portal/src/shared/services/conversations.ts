/**
 * Conversations Service
 * 
 * Data access layer for conversation management
 */

import { supabase } from '../config/supabase';
import type { Conversation, ConversationMessage } from '../types/database';

export interface CreateConversationInput {
  name: string;
  template_id: string;
  current_state: unknown;
}

export interface UpdateConversationInput {
  name?: string;
  current_state?: unknown;
}

export interface CreateMessageInput {
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  changes?: Record<string, unknown>;
}

export class ConversationService {
  /**
   * Get all conversations for the current user
   */
  static async list(userId: string): Promise<Conversation[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  /**
   * Get a single conversation by ID
   */
  static async get(id: string, userId: string): Promise<Conversation | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  /**
   * Create a new conversation from a template
   */
  static async create(input: CreateConversationInput, userId: string): Promise<Conversation> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        ...input,
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a conversation
   */
  static async update(
    id: string,
    input: UpdateConversationInput,
    userId: string
  ): Promise<Conversation> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('conversations')
      .update(input)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a conversation
   */
  static async delete(id: string, userId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Get messages for a conversation
   */
  static async getMessages(conversationId: string): Promise<ConversationMessage[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  /**
   * Add a message to a conversation
   */
  static async addMessage(input: CreateMessageInput): Promise<ConversationMessage> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('conversation_messages')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update conversation state after AI processing
   */
  static async updateStateWithMessage(
    conversationId: string,
    userId: string,
    newState: unknown,
    message: CreateMessageInput
  ): Promise<{ conversation: Conversation; message: ConversationMessage }> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Update conversation state
    const conversation = await this.update(
      conversationId,
      { current_state: newState },
      userId
    );

    // Add the message
    const messageResult = await this.addMessage(message);

    return {
      conversation,
      message: messageResult
    };
  }
}
