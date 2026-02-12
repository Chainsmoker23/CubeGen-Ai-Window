import React from 'react';
import { IconType } from '../../types';

// Base icons that are always loaded (lightweight)
import { BASE_ICONS } from './baseIcons';

// Cloud library icons are loaded LAZILY - only when requested
let CLOUD_ICONS_LOADED = false;
let CLOUD_ICONS_CACHE: Record<string, string> = {};
let cloudIconsLoadPromise: Promise<void> | null = null;

/**
 * Lazy load cloud library icons
 * Only called when a cloud icon is actually requested and not found in BASE_ICONS
 */
async function loadCloudIcons(): Promise<void> {
  if (CLOUD_ICONS_LOADED) return;
  if (cloudIconsLoadPromise) return cloudIconsLoadPromise;

  cloudIconsLoadPromise = (async () => {
    try {
      const { CLOUD_LIBRARY_ICONS } = await import('./cloudLibrary');
      CLOUD_ICONS_CACHE = CLOUD_LIBRARY_ICONS;
      CLOUD_ICONS_LOADED = true;
    } catch (e) {
      console.warn('Failed to load cloud icons library:', e);
      CLOUD_ICONS_LOADED = true; // Mark as loaded to avoid retry
    }
  })();

  return cloudIconsLoadPromise;
}

/**
 * Combined ICONS object that:
 * 1. Returns base icons immediately (no loading)
 * 2. Returns cloud icons if already loaded
 * 3. Triggers lazy load of cloud icons for future requests
 */
export const ICONS: Record<string, React.ReactNode> = new Proxy(
  { ...BASE_ICONS } as Record<string, React.ReactNode>,
  {
    get(_target, prop: string) {
      // First check base icons (always available)
      if (prop in BASE_ICONS) {
        return BASE_ICONS[prop];
      }

      // Check cloud icons cache if loaded
      if (CLOUD_ICONS_LOADED && prop in CLOUD_ICONS_CACHE) {
        return CLOUD_ICONS_CACHE[prop];
      }

      // If cloud icons not loaded yet, trigger load for future requests
      if (!CLOUD_ICONS_LOADED) {
        loadCloudIcons();
      }

      // Return generic icon as fallback
      return BASE_ICONS[IconType.Generic];
    },
    has(_target, prop: string) {
      return prop in BASE_ICONS || (CLOUD_ICONS_LOADED && prop in CLOUD_ICONS_CACHE);
    },
    ownKeys() {
      const baseKeys = Object.keys(BASE_ICONS);
      if (CLOUD_ICONS_LOADED) {
        return [...new Set([...baseKeys, ...Object.keys(CLOUD_ICONS_CACHE)])];
      }
      return baseKeys;
    },
    getOwnPropertyDescriptor(_target, prop) {
      if (prop in BASE_ICONS || (CLOUD_ICONS_LOADED && prop in CLOUD_ICONS_CACHE)) {
        return { enumerable: true, configurable: true };
      }
      return undefined;
    }
  }
);

/**
 * Preload cloud icons (call this when entering Playground or other heavy pages)
 */
export function preloadCloudIcons(): Promise<void> {
  return loadCloudIcons();
}

/**
 * Check if cloud icons are loaded
 */
export function areCloudIconsLoaded(): boolean {
  return CLOUD_ICONS_LOADED;
}

// FOOTER_LINKS removed as per user request to only include icon library logic