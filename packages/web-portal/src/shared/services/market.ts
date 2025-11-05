/**
 * Market Service
 * 
 * Data access layer for market item management
 */

import { supabase } from '../config/supabase';
import type { MarketItem } from '../types/database';

export interface CreateMarketItemInput {
  name: string;
  description: string;
  item_type: 'repository' | 'flow' | 'hybrid';
  access_type: 'clone_only' | 'merge_only' | 'both';
  tags?: string[];
  readme: string;
  license: string;
  repository_state?: unknown;
  repository_metadata?: Record<string, unknown>;
  workflow_data?: unknown;
}

export interface UpdateMarketItemInput {
  name?: string;
  description?: string;
  tags?: string[];
  readme?: string;
  license?: string;
  repository_state?: unknown;
  repository_metadata?: Record<string, unknown>;
  workflow_data?: unknown;
}

export interface MarketSearchFilters {
  item_type?: 'repository' | 'flow' | 'hybrid';
  tags?: string[];
  search?: string;
}

export class MarketService {
  /**
   * List all market items with optional filters
   */
  static async list(filters?: MarketSearchFilters): Promise<MarketItem[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    let query = supabase
      .from('market_items')
      .select('*');

    if (filters?.item_type) {
      query = query.eq('item_type', filters.item_type);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  /**
   * Get a single market item by ID
   */
  static async get(id: string): Promise<MarketItem | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('market_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    // Increment view count
    await this.incrementStat(id, 'view_count');

    return data;
  }

  /**
   * Create a new market item
   */
  static async create(input: CreateMarketItemInput, publisherId: string): Promise<MarketItem> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('market_items')
      .insert({
        ...input,
        tags: input.tags ?? [],
        clone_count: 0,
        merge_count: 0,
        view_count: 0,
        publisher_id: publisherId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a market item
   */
  static async update(
    id: string,
    input: UpdateMarketItemInput,
    publisherId: string
  ): Promise<MarketItem> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('market_items')
      .update(input)
      .eq('id', id)
      .eq('publisher_id', publisherId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a market item
   */
  static async delete(id: string, publisherId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase
      .from('market_items')
      .delete()
      .eq('id', id)
      .eq('publisher_id', publisherId);

    if (error) throw error;
  }

  /**
   * Increment a stat (clone_count, merge_count, view_count)
   */
  static async incrementStat(id: string, stat: 'clone_count' | 'merge_count' | 'view_count'): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase.rpc('increment_market_stat', {
      item_id: id,
      stat_name: stat
    });

    if (error) {
      console.error('Failed to increment stat:', error);
    }
  }

  /**
   * Clone a market item (for repositories and hybrid items)
   */
  static async clone(id: string): Promise<{
    repository_state?: unknown;
    repository_metadata?: Record<string, unknown>;
    workflow_data?: unknown;
  }> {
    const item = await this.get(id);
    if (!item) {
      throw new Error('Market item not found');
    }

    if (item.access_type === 'merge_only') {
      throw new Error('This item can only be merged, not cloned');
    }

    await this.incrementStat(id, 'clone_count');

    return {
      repository_state: item.repository_state,
      repository_metadata: item.repository_metadata,
      workflow_data: item.workflow_data
    };
  }

  /**
   * Get merge data for a market item
   */
  static async getMergeData(id: string): Promise<{
    repository_state?: unknown;
    workflow_data?: unknown;
  }> {
    const item = await this.get(id);
    if (!item) {
      throw new Error('Market item not found');
    }

    if (item.access_type === 'clone_only') {
      throw new Error('This item can only be cloned, not merged');
    }

    await this.incrementStat(id, 'merge_count');

    return {
      repository_state: item.repository_state,
      workflow_data: item.workflow_data
    };
  }

  /**
   * Get all tags used in the market
   */
  static async getAllTags(): Promise<string[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('market_items')
      .select('tags');

    if (error) throw error;

    // Flatten and deduplicate tags
    const allTags = new Set<string>();
    data?.forEach(item => {
      item.tags?.forEach((tag: string) => allTags.add(tag));
    });

    return Array.from(allTags).sort();
  }
}
