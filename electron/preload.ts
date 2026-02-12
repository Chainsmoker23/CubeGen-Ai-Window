
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    ping: () => ipcRenderer.invoke('ping'),
    minimize: () => ipcRenderer.invoke('minimize'),
    maximize: () => ipcRenderer.invoke('maximize'),
    close: () => ipcRenderer.invoke('close'),
    saveFile: (content: string) => ipcRenderer.invoke('save-file', content),
    loadFile: () => ipcRenderer.invoke('load-file'),

    // Auto-save to disk (background persistence)
    autoSaveToDisk: (key: string, content: string) => ipcRenderer.invoke('auto-save-to-disk', key, content),
    autoLoadFromDisk: (key: string) => ipcRenderer.invoke('auto-load-from-disk', key),

    // Auth Callback Listener
    onAuthCallback: (callback: (url: string) => void) => {
        const handler = (_: any, url: string) => callback(url)
        ipcRenderer.on('auth-callback', handler)
        return () => ipcRenderer.removeListener('auth-callback', handler)
    },

    // Listen for quit signal to trigger final save
    onBeforeQuit: (callback: () => void) => {
        ipcRenderer.on('app-before-quit', () => callback())
    },
})
