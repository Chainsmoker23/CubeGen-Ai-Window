/**
 * projectStore.ts — Auto-save / restore service for CubeGen projects.
 *
 * Uses localStorage as the primary storage backend. Works in both
 * Electron and plain browser contexts with zero configuration.
 *
 * Also exposes helpers to persist to disk via Electron IPC when available.
 */

import { useEffect, useRef } from 'react';
import { DiagramData } from '../types';

// ─── Types ───────────────────────────────────────────────────────────

export interface SavedProject {
    /** Unique key, e.g. "visual-playground" or "code-playground" */
    key: string;
    /** The diagram state */
    diagramData: DiagramData;
    /** Source code (only used by CodePlayground) */
    code?: string;
    /** ISO timestamp of last save */
    savedAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────

const STORAGE_PREFIX = 'cubegen-project:';

// ─── Core API ────────────────────────────────────────────────────────

/**
 * Save a project to localStorage.
 */
export function saveProject(key: string, diagramData: DiagramData, code?: string): void {
    try {
        const entry: SavedProject = {
            key,
            diagramData,
            code,
            savedAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch (err) {
        console.warn('[projectStore] Failed to save project:', err);
    }
}

/**
 * Load a project from localStorage. Returns null if nothing is saved.
 */
export function loadProject(key: string): SavedProject | null {
    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        if (!raw) return null;
        return JSON.parse(raw) as SavedProject;
    } catch (err) {
        console.warn('[projectStore] Failed to load project:', err);
        return null;
    }
}

/**
 * List all saved project keys (without the prefix).
 */
export function listProjects(): SavedProject[] {
    const projects: SavedProject[] = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(STORAGE_PREFIX)) {
                const raw = localStorage.getItem(k);
                if (raw) {
                    projects.push(JSON.parse(raw));
                }
            }
        }
    } catch (err) {
        console.warn('[projectStore] Failed to list projects:', err);
    }
    return projects;
}

/**
 * Delete a saved project.
 */
export function deleteProject(key: string): void {
    try {
        localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (err) {
        console.warn('[projectStore] Failed to delete project:', err);
    }
}

/**
 * Archive a project before starting fresh.
 * Copies the current project to a timestamped key so it's preserved,
 * then removes the original key so the playground starts clean.
 */
export function archiveProject(key: string): void {
    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        if (!raw) return;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archiveKey = `${STORAGE_PREFIX}archive:${key}:${timestamp}`;
        localStorage.setItem(archiveKey, raw);
        localStorage.removeItem(STORAGE_PREFIX + key);
        console.log('[projectStore] Archived project:', key, '→', archiveKey);
    } catch (err) {
        console.warn('[projectStore] Failed to archive project:', err);
    }
}

/**
 * An archived project with its localStorage key (needed for deletion).
 */
export interface ArchivedProject extends SavedProject {
    /** Full localStorage key for this archive entry */
    storageKey: string;
}

/**
 * List all archived projects for a given playground key.
 * Returns them sorted newest-first.
 */
export function listArchivedProjects(playgroundKey: string): ArchivedProject[] {
    const archivePrefix = `${STORAGE_PREFIX}archive:${playgroundKey}:`;
    const projects: ArchivedProject[] = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(archivePrefix)) {
                const raw = localStorage.getItem(k);
                if (raw) {
                    const parsed = JSON.parse(raw) as SavedProject;
                    projects.push({ ...parsed, storageKey: k });
                }
            }
        }
    } catch (err) {
        console.warn('[projectStore] Failed to list archives:', err);
    }
    // Sort newest-first
    return projects.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

/**
 * Delete a specific archived project by its localStorage key.
 */
export function deleteArchivedProject(storageKey: string): void {
    try {
        localStorage.removeItem(storageKey);
        console.log('[projectStore] Deleted archive:', storageKey);
    } catch (err) {
        console.warn('[projectStore] Failed to delete archive:', err);
    }
}

// ─── React Hook: useAutoSave ─────────────────────────────────────────

/**
 * Debounced auto-save hook using refs to avoid stale closures.
 *
 * Saves to localStorage every time data changes (debounced by delayMs).
 * Also saves immediately on unmount (navigating away / closing).
 */
export function useAutoSave(
    key: string,
    diagramData: DiagramData | null,
    code?: string,
    delayMs = 500,
): void {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Use refs to always have the latest values (avoids stale closure on unmount)
    const latestDataRef = useRef(diagramData);
    const latestCodeRef = useRef(code);
    const keyRef = useRef(key);

    // Keep refs in sync with latest values
    latestDataRef.current = diagramData;
    latestCodeRef.current = code;
    keyRef.current = key;

    useEffect(() => {
        // Don't save null / empty data
        if (!diagramData) return;

        // Clear previous timer
        if (timerRef.current) clearTimeout(timerRef.current);

        // Schedule a debounced save
        timerRef.current = setTimeout(() => {
            saveProject(key, diagramData, code);
        }, delayMs);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [key, diagramData, code, delayMs]);

    // Save immediately on unmount using refs (always has latest data)
    useEffect(() => {
        return () => {
            if (latestDataRef.current) {
                saveProject(keyRef.current, latestDataRef.current, latestCodeRef.current);
            }
        };
    }, []);
}

// electronAPI types are declared in vite-env.d.ts

/**
 * Persist all saved projects to disk via Electron IPC.
 * No-op in browser context.
 */
export async function persistAllToDisk(): Promise<void> {
    if (!window.electronAPI?.autoSaveToDisk) return;
    const projects = listProjects();
    for (const p of projects) {
        try {
            await window.electronAPI.autoSaveToDisk(p.key, JSON.stringify(p));
        } catch (err) {
            console.warn('[projectStore] Failed to persist to disk:', err);
        }
    }
}

/**
 * Load a project from disk via Electron IPC and merge into localStorage.
 * Prefers the more recently saved version (disk vs localStorage).
 */
export async function loadFromDisk(key: string): Promise<SavedProject | null> {
    if (!window.electronAPI?.autoLoadFromDisk) return null;
    try {
        const raw = await window.electronAPI.autoLoadFromDisk(key);
        if (!raw) return null;
        const diskProject = JSON.parse(raw) as SavedProject;
        const localProject = loadProject(key);

        // If disk version is newer, update localStorage
        if (!localProject || new Date(diskProject.savedAt) > new Date(localProject.savedAt)) {
            localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(diskProject));
            return diskProject;
        }
        return localProject;
    } catch (err) {
        console.warn('[projectStore] Failed to load from disk:', err);
        return null;
    }
}
