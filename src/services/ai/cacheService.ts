// CacheService — in-memory + localStorage cache for AI search results
// Prevents redundant API calls for identical searches.

import type { CacheEntry, SearchRequest } from '../../types/ai.types';
import { logger } from '../../utils/logger';

const CACHE_PREFIX = 'elevateher_cache_';
const DEFAULT_TTL_MS = 30 * 60 * 1000;   // 30 minutes
const MAX_MEMORY_ENTRIES = 50;

// In-memory layer for ultra-fast repeat lookups within the same session
const memoryCache = new Map<string, CacheEntry<unknown>>();

const CacheService = {
  /**
   * Generate a deterministic cache key from a SearchRequest.
   * Sensitive profile fields (income, category, PWD) ARE included
   * because they affect recommendations, but keys are never logged.
   */
  buildKey(request: SearchRequest): string {
    const parts = [
      request.type,
      request.featureInput ? JSON.stringify(sortKeys(request.featureInput)) : '',
      request.profile.qualification ?? '',
      request.profile.specialization ?? '',
      request.profile.occupation ?? '',
      request.profile.state ?? '',
      request.profile.annual_income ?? '',
      request.profile.category ?? '',
      request.profile.pwd_status ?? '',
      String(request.maxResults ?? 6),
    ];
    return parts.join('|').toLowerCase().replace(/\s+/g, '_');
  },

  /**
   * Retrieve a cached result. Returns null if missing or expired.
   */
  get<T>(key: string): T | null {
    const now = Date.now();

    // Check memory first
    const memEntry = memoryCache.get(key);
    if (memEntry) {
      if (now < memEntry.expiresAt) {
        logger.debug('CacheService', `Memory cache HIT: ${key.slice(0, 40)}...`);
        return memEntry.data as T;
      }
      memoryCache.delete(key);
    }

    // Check localStorage
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw) as CacheEntry<T>;
      if (now >= entry.expiresAt) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      // Promote to memory cache
      memoryCache.set(key, entry as CacheEntry<unknown>);
      logger.debug('CacheService', `LocalStorage cache HIT: ${key.slice(0, 40)}...`);
      return entry.data;
    } catch {
      return null;
    }
  },

  /**
   * Store a result in both memory and localStorage.
   */
  set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      key,
      data,
      cachedAt: now,
      expiresAt: now + ttlMs,
    };

    // Memory cache with size limit
    if (memoryCache.size >= MAX_MEMORY_ENTRIES) {
      const oldest = [...memoryCache.entries()].sort(
        ([, a], [, b]) => a.cachedAt - b.cachedAt,
      )[0];
      if (oldest) memoryCache.delete(oldest[0]);
    }
    memoryCache.set(key, entry as CacheEntry<unknown>);

    // Persist to localStorage (best-effort)
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
      // localStorage quota exceeded — memory cache still works
      logger.warn('CacheService', 'localStorage write failed (quota?)');
    }

    logger.debug('CacheService', `Cached: ${key.slice(0, 40)}... TTL=${ttlMs / 1000}s`);
  },

  /**
   * Remove a specific cached entry.
   */
  invalidate(key: string): void {
    memoryCache.delete(key);
    try { localStorage.removeItem(CACHE_PREFIX + key); } catch { /* ignore */ }
  },

  /**
   * Clear all ElevateHer cache entries from localStorage.
   */
  clearAll(): void {
    memoryCache.clear();
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(CACHE_PREFIX)) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      logger.info('CacheService', `Cleared ${keysToRemove.length} cache entries`);
    } catch { /* ignore */ }
  },

  /**
   * Remove all expired entries from localStorage (call on app start if desired).
   */
  pruneExpired(): void {
    const now = Date.now();
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k?.startsWith(CACHE_PREFIX)) continue;
        try {
          const entry = JSON.parse(localStorage.getItem(k) ?? '{}') as CacheEntry<unknown>;
          if (now >= entry.expiresAt) keysToRemove.push(k);
        } catch {
          keysToRemove.push(k!);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      if (keysToRemove.length > 0) {
        logger.info('CacheService', `Pruned ${keysToRemove.length} expired entries`);
      }
    } catch { /* ignore */ }
  },

  /**
   * Check if a key exists and is not expired.
   */
  has(key: string): boolean {
    return CacheService.get(key) !== null;
  },

  /**
   * Invalidate all cache entries for a specific feature type.
   */
  invalidateByType(featureType: string): void {
    const prefix = `${featureType}|`;
    const keysToRemove: string[] = [];

    // Check memory cache
    for (const [key] of memoryCache.entries()) {
      if (key.startsWith(prefix)) {
        keysToRemove.push(key);
        memoryCache.delete(key);
      }
    }

    // Check localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(CACHE_PREFIX + prefix)) {
          keysToRemove.push(k);
          localStorage.removeItem(k);
        }
      }
      if (keysToRemove.length > 0) {
        logger.info('CacheService', `Invalidated ${keysToRemove.length} entries for type: ${featureType}`);
      }
    } catch { /* ignore */ }
  },
};

function sortKeys(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)),
  );
}

export default CacheService;
