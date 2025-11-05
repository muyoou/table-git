/**
 * Templates Service
 * 
 * Data access layer for template management
 */

import { supabase } from '../config/supabase';
import type { Template } from '../types/database';

export interface CreateTemplateInput {
  name: string;
  description?: string;
  repository_state: unknown;
  repository_metadata?: Record<string, unknown>;
  flow_ids?: string[];
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  repository_state?: unknown;
  repository_metadata?: Record<string, unknown>;
  flow_ids?: string[];
}

export class TemplateService {
  /**
   * Get all templates for the current user
   */
  static async list(userId: string): Promise<Template[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  /**
   * Get a single template by ID
   */
  static async get(id: string, userId: string): Promise<Template | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('templates')
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
   * Create a new template
   */
  static async create(input: CreateTemplateInput, userId: string): Promise<Template> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('templates')
      .insert({
        ...input,
        repository_metadata: input.repository_metadata ?? {},
        flow_ids: input.flow_ids ?? [],
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a template
   */
  static async update(
    id: string,
    input: UpdateTemplateInput,
    userId: string
  ): Promise<Template> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('templates')
      .update(input)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a template
   */
  static async delete(id: string, userId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Associate a flow with a template
   */
  static async addFlow(templateId: string, flowId: string, userId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const template = await this.get(templateId, userId);
    if (!template) {
      throw new Error('Template not found');
    }

    const flowIds = [...(template.flow_ids ?? []), flowId];

    await this.update(templateId, { flow_ids: flowIds }, userId);
  }

  /**
   * Remove a flow from a template
   */
  static async removeFlow(templateId: string, flowId: string, userId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const template = await this.get(templateId, userId);
    if (!template) {
      throw new Error('Template not found');
    }

    const flowIds = (template.flow_ids ?? []).filter(id => id !== flowId);

    await this.update(templateId, { flow_ids: flowIds }, userId);
  }
}
