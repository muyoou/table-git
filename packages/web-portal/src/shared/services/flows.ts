/**
 * Flows Service
 * 
 * Data access layer for flow and global flow management
 */

import { supabase } from '../config/supabase';
import type { Flow, GlobalFlow } from '../types/database';

export interface CreateFlowInput {
  name: string;
  description?: string;
  workflow_data: unknown;
  template_id?: string;
}

export interface UpdateFlowInput {
  name?: string;
  description?: string;
  workflow_data?: unknown;
  template_id?: string;
}

export interface CreateGlobalFlowInput {
  name: string;
  description?: string;
  workflow_data: unknown;
  enabled?: boolean;
  priority?: number;
}

export interface UpdateGlobalFlowInput {
  name?: string;
  description?: string;
  workflow_data?: unknown;
  enabled?: boolean;
  priority?: number;
}

export class FlowService {
  /**
   * Get all flows for the current user
   */
  static async list(userId: string, templateId?: string): Promise<Flow[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    let query = supabase
      .from('flows')
      .select('*')
      .eq('user_id', userId);

    if (templateId) {
      query = query.eq('template_id', templateId);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  /**
   * Get a single flow by ID
   */
  static async get(id: string, userId: string): Promise<Flow | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('flows')
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
   * Create a new flow
   */
  static async create(input: CreateFlowInput, userId: string): Promise<Flow> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('flows')
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
   * Update a flow
   */
  static async update(
    id: string,
    input: UpdateFlowInput,
    userId: string
  ): Promise<Flow> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('flows')
      .update(input)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a flow
   */
  static async delete(id: string, userId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase
      .from('flows')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }
}

export class GlobalFlowService {
  /**
   * Get all global flows for the current user
   */
  static async list(userId: string, onlyEnabled = false): Promise<GlobalFlow[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    let query = supabase
      .from('global_flows')
      .select('*')
      .eq('user_id', userId);

    if (onlyEnabled) {
      query = query.eq('enabled', true);
    }

    const { data, error } = await query.order('priority', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  /**
   * Get a single global flow by ID
   */
  static async get(id: string, userId: string): Promise<GlobalFlow | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('global_flows')
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
   * Create a new global flow
   */
  static async create(input: CreateGlobalFlowInput, userId: string): Promise<GlobalFlow> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('global_flows')
      .insert({
        ...input,
        enabled: input.enabled ?? true,
        priority: input.priority ?? 0,
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a global flow
   */
  static async update(
    id: string,
    input: UpdateGlobalFlowInput,
    userId: string
  ): Promise<GlobalFlow> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('global_flows')
      .update(input)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a global flow
   */
  static async delete(id: string, userId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase
      .from('global_flows')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Toggle a global flow on/off
   */
  static async toggle(id: string, userId: string): Promise<GlobalFlow> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const flow = await this.get(id, userId);
    if (!flow) {
      throw new Error('Global flow not found');
    }

    return this.update(id, { enabled: !flow.enabled }, userId);
  }
}
