
import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

// Prevent garbage collection
let mainWindow: BrowserWindow | null = null

// Auto-save directory inside user's AppData
const getProjectsDir = () => join(app.getPath('userData'), 'cubegen-projects')

// Retrying loadURL logic to handle Vite startup delay
const loadURLWithRetry = async (window: BrowserWindow, url: string, retries = 20, delay = 1000) => {
    try {
        await window.loadURL(url)
    } catch (e: any) {
        if (retries > 0) {
            setTimeout(() => {
                loadURLWithRetry(window, url, retries - 1, delay)
            }, delay)
        } else {
            console.error(`Failed to load ${url} after multiple attempts.`, e)
            // Optional: Load a fallback error file
            // window.loadFile(join(__dirname, '../dist/error.html'))
        }
    }
}

const createWindow = () => {
    const iconPath = process.env.VITE_DEV_SERVER_URL
        ? join(__dirname, '../public/icon.png')
        : join(__dirname, '../dist/icon.png');

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "CubeGen AI Studio",
        icon: iconPath,
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        frame: true, // Enabled frame for debugging visibility
        autoHideMenuBar: true, // Hide menu bar
        // titleBarStyle: 'hidden', // Commented out to ensure frame is visible
        // titleBarOverlay removed to prevent duplicate controls
    })
    mainWindow.removeMenu(); // Explicitly remove menu

    // Development mode: load from Vite dev server with retry
    if (process.env.VITE_DEV_SERVER_URL) {
        loadURLWithRetry(mainWindow, process.env.VITE_DEV_SERVER_URL)
        mainWindow.webContents.openDevTools()
    } else {
        // Production mode: load from built files
        mainWindow.loadFile(join(__dirname, '../dist/index.html'))
    }

    // Notify renderer before app quits so it can do a final save
    mainWindow.on('close', () => {
        mainWindow?.webContents.send('app-before-quit')
    })
}


// ─── Deep Linking Setup ───

if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('cubegen', process.execPath, [join(process.cwd(), 'dist-electron/main.js')])
    }
} else {
    app.setAsDefaultProtocolClient('cubegen')
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (_event, commandLine) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()

            // Keep only the last argument which is the URL
            const url = commandLine.pop()
            if (url?.startsWith('cubegen://')) {
                console.log('Received deep link (Windows):', url)
                mainWindow.webContents.send('auth-callback', url)
            }
        }
    })

    app.whenReady().then(() => {
        createWindow()

        // IPC handlers for window controls
        ipcMain.handle('minimize', () => mainWindow?.minimize())
        ipcMain.handle('maximize', () => {
            if (mainWindow?.isMaximized()) {
                mainWindow.unmaximize()
            } else {
                mainWindow?.maximize()
            }
        })
        ipcMain.handle('close', () => mainWindow?.close())

        // ─── File System Handlers (Manual Save/Load via dialog) ───

        ipcMain.handle('save-file', async (_event, content: string) => {
            if (!mainWindow) return false
            const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
                title: 'Save Diagram',
                defaultPath: 'diagram.cubegen.json',
                filters: [{ name: 'CubeGen Diagram', extensions: ['json'] }]
            })

            if (canceled || !filePath) return false

            try {
                await writeFile(filePath, content, 'utf-8')
                return true
            } catch (e) {
                console.error('Failed to save file:', e)
                return false
            }
        })

        ipcMain.handle('load-file', async () => {
            if (!mainWindow) return null
            const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
                title: 'Open Diagram',
                filters: [{ name: 'CubeGen Diagram', extensions: ['json'] }],
                properties: ['openFile']
            })

            if (canceled || filePaths.length === 0) return null

            try {
                const content = await readFile(filePaths[0], 'utf-8')
                return content
            } catch (e) {
                console.error('Failed to load file:', e)
                return null
            }
        })

        // ─── Auto-Save Handlers (Background persistence to userData) ───

        ipcMain.handle('auto-save-to-disk', async (_event, key: string, content: string) => {
            try {
                const dir = getProjectsDir()
                if (!existsSync(dir)) {
                    await mkdir(dir, { recursive: true })
                }
                const filePath = join(dir, `${key}.json`)
                await writeFile(filePath, content, 'utf-8')
                return true
            } catch (e) {
                console.error('[auto-save] Failed to save:', e)
                return false
            }
        })

        ipcMain.handle('auto-load-from-disk', async (_event, key: string) => {
            try {
                const filePath = join(getProjectsDir(), `${key}.json`)
                if (!existsSync(filePath)) return null
                const content = await readFile(filePath, 'utf-8')
                return content
            } catch (e) {
                console.error('[auto-load] Failed to load:', e)
                return null
            }
        })

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) createWindow()
        })

        // macOS Deep Link Handling
        app.on('open-url', (event, url) => {
            event.preventDefault()
            console.log('Received deep link (macOS):', url)
            if (mainWindow) {
                mainWindow.webContents.send('auth-callback', url)
            }
        })
    })
}

// ─── Auto-Updater ───
import { autoUpdater } from 'electron-updater';

// Configure logging
autoUpdater.logger = require("electron-log");
(autoUpdater.logger as any).transports.file.level = "info";

function setupAutoUpdater() {
    // Check for updates immediately when app starts
    autoUpdater.checkForUpdatesAndNotify();

    // Optional: Listen for events to show UI feedback
    autoUpdater.on('update-available', () => {
        mainWindow?.webContents.send('update-available');
    });

    autoUpdater.on('update-downloaded', () => {
        mainWindow?.webContents.send('update-downloaded');
        // Silent install on quit is default
    });
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

app.whenReady().then(() => {
    setupAutoUpdater();
});
