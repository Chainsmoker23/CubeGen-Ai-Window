/// <reference types="vite/client" />

interface Window {
    electronAPI: {
        ping: () => Promise<string>
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close: () => Promise<void>
        saveFile: (content: string) => Promise<boolean>
        loadFile: () => Promise<string | null>
        autoSaveToDisk: (key: string, content: string) => Promise<boolean>
        autoLoadFromDisk: (key: string) => Promise<string | null>
        onBeforeQuit: (callback: () => void) => void
    }
}
