/**
 * SavedItemsService
 *
 * Universal save/unsave/fetch/check/count service for all recommendation types.
 * Every feature module must use this service — no direct saved_items writes elsewhere.
 *
 * Stores a complete recommendation_snapshot so the Saved page renders identically
 * to the source module even if external data later changes.
 */

import { supabase } from './supabase/client';
import { parseError } from '../utils/errorHandler';
import type { SavedItem, SavedItemType, SaveInput } from '../types/saved.types';

export interface SavedServiceResult<T = null> {
  data: T | null;
  error: string | null;
}

const SavedItemsService = {
  // ── Save ───────────────────────────────────────────────────────────────────

  async save(input: SaveInput): Promise<SavedServiceResult<SavedItem>> {
    const snapshot = input.snapshot;
    const sourceUrl = (snapshot?.metadata as any)?.sourceUrl || snapshot?.applicationLink || snapshot?.source || input.itemMetadata?.sourceUrl || null;
    const officialWebsite = snapshot?.officialWebsite || (snapshot?.metadata as any)?.officialWebsite || input.itemMetadata?.officialWebsite || null;

    const { data, error } = await supabase
      .from('saved_items')
      .upsert(
        {
          user_id: input.userId,
          item_type: input.itemType,
          item_id: input.itemId,
          item_title: input.itemTitle,
          item_metadata: input.itemMetadata ?? null,
          recommendation_snapshot: input.snapshot ?? null,
          source_url: sourceUrl,
          official_website: officialWebsite,
          last_checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,item_type,item_id' },
      )
      .select()
      .single();

    if (error) return { data: null, error: parseError(error) };
    return { data: data as SavedItem, error: null };
  },

  // ── Unsave ─────────────────────────────────────────────────────────────────

  async unsave(
    userId: string,
    itemType: SavedItemType,
    itemId: string,
  ): Promise<SavedServiceResult> {
    const { error } = await supabase
      .from('saved_items')
      .delete()
      .eq('user_id', userId)
      .eq('item_type', itemType)
      .eq('item_id', itemId);

    if (error) return { data: null, error: parseError(error) };
    return { data: null, error: null };
  },

  // ── Check saved ────────────────────────────────────────────────────────────

  async isSaved(
    userId: string,
    itemType: SavedItemType,
    itemId: string,
  ): Promise<boolean> {
    const { data } = await supabase
      .from('saved_items')
      .select('id')
      .eq('user_id', userId)
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .maybeSingle();
    return !!data;
  },

  // ── Fetch all for user ─────────────────────────────────────────────────────

  async getAll(userId: string): Promise<SavedServiceResult<SavedItem[]>> {
    const { data, error } = await supabase
      .from('saved_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: parseError(error) };
    return { data: data as SavedItem[], error: null };
  },

  // ── Fetch by type ──────────────────────────────────────────────────────────

  async getByType(
    userId: string,
    itemType: SavedItemType,
  ): Promise<SavedServiceResult<SavedItem[]>> {
    const { data, error } = await supabase
      .from('saved_items')
      .select('*')
      .eq('user_id', userId)
      .eq('item_type', itemType)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: parseError(error) };
    return { data: data as SavedItem[], error: null };
  },

  // ── Count all saved items for a user ───────────────────────────────────────

  async getCount(userId: string): Promise<SavedServiceResult<number>> {
    const { count, error } = await supabase
      .from('saved_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) return { data: null, error: parseError(error) };
    return { data: count ?? 0, error: null };
  },

  // ── Get set of saved item IDs for a given type (for bulk isSaved checks) ──

  async getSavedIds(
    userId: string,
    itemType: SavedItemType,
  ): Promise<Set<string>> {
    const { data, error } = await supabase
      .from('saved_items')
      .select('item_id')
      .eq('user_id', userId)
      .eq('item_type', itemType);

    if (error || !data) return new Set();
    return new Set((data as { item_id: string }[]).map((r) => r.item_id));
  },
};

export default SavedItemsService;
