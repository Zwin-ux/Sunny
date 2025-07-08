/**
 * Simple in-memory caching implementation for Sunny
 * For production, consider using Redis or another distributed cache
 */

import { logger } from './logger';

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

class Cache {
  private store: Map<string, CacheEntry<any>> = new Map();
  private maxEntries: number = 1000; // Prevent memory leaks

  /**
   * Get a value from cache
   * 
   * @param key - Cache key
   * @returns Cached value or undefined if not found/expired
   */
  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    const now = Date.now();
    
    // Return undefined if entry doesn't exist or has expired
    if (!entry || now > entry.expiry) {
      if (entry) {
        // Clean up expired entry
        this.store.delete(key);
        logger.debug('Cache entry expired', { key });
      }
      return undefined;
    }
    
    logger.debug('Cache hit', { key });
    return entry.value as T;
  }

  /**
   * Set a value in cache with expiration
   * 
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlSeconds - Time to live in seconds
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    // Clean up if we're at capacity
    if (this.store.size >= this.maxEntries) {
      this.cleanup();
    }
    
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, { value, expiry });
    logger.debug('Cache set', { key, ttlSeconds });
  }

  /**
   * Delete a value from cache
   * 
   * @param key - Cache key
   * @returns true if entry was deleted, false if it didn't exist
   */
  async delete(key: string): Promise<boolean> {
    const result = this.store.delete(key);
    if (result) {
      logger.debug('Cache entry deleted', { key });
    }
    return result;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    const size = this.store.size;
    this.store.clear();
    logger.debug('Cache cleared', { entriesRemoved: size });
  }

  /**
   * Clean up expired entries and remove oldest if at capacity
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    // First try to remove expired entries
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiry) {
        this.store.delete(key);
        cleanedCount++;
      }
      
      // If we've freed up enough space, stop
      if (this.store.size < this.maxEntries * 0.9) {
        break;
      }
    }
    
    // If still too many entries, remove oldest (approximation using iteration order)
    if (this.store.size >= this.maxEntries) {
      const keysToDelete = Array.from(this.store.keys()).slice(0, Math.floor(this.maxEntries * 0.2));
      for (const key of keysToDelete) {
        this.store.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} cache entries`);
    }
  }
}

// Export singleton instance
export const cache = new Cache();
