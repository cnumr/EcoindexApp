import { BrowserWindow, app, ipcMain, dialog } from 'electron'
import i18n, { initializeI18n } from '../configs/i18next.config'

import { LinuxUpdate } from '../class/LinuxUpdate'
import Store from 'electron-store'
import Updater from './Updater'
import { buildMenu } from './menus/menuFactory'
import { channels } from '../shared/constants'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { initialization } from './handlers/Initalization'
import log from 'electron-log'
import path from 'node:path'
import pkg from '../../package.json'
import { setMainWindow } from './memory'
import {
    handleSimpleCollect,
    handleJsonSaveAndCollect,
} from './handlers/HandleCollectAll'
import { handleSelectFolder } from './handlers/HandleSelectFolder'
import { handleSelectPuppeteerFilePath } from './handlers/HandleSelectPuppeteerFilePath'
import { handleIsJsonConfigFileExist } from './handlers/HandleIsJsonConfigFileExist'
import { handleJsonReadAndReload } from './handlers/HandleJsonReadAndReload'

// Configuration de electron-log
log.initialize()
log.transports.file.level = 'debug' // Toujours en debug pour les fichiers
log.transports.console.level = 'debug' // Toujours en debug pour la console
log.transports.file.maxSize = 5 * 1024 * 1024 // 5MB
log.log('electron-log initialized, file:', log.transports.file.getFile().path)

export const getMainLog = () => {
    return log
}

const require = createRequire(import.meta.url)

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// Utiliser try-catch car le module peut ne pas être disponible en production
try {
    if (require('electron-squirrel-startup')) {
        app.quit()
    }
} catch {
    // Le module n'est pas disponible, continuer normalement
    // C'est normal sur macOS/Linux où ce module n'est pas nécessaire
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
// En développement, utiliser __dirname, en production utiliser app.getAppPath()
const getAppRoot = () => {
    if (app.isPackaged) {
        return app.getAppPath()
    }
    return path.join(__dirname, '../..')
}

// Initialiser APP_ROOT après que app soit disponible
const APP_ROOT = getAppRoot()
process.env.APP_ROOT = APP_ROOT

// Fonction pour obtenir le chemin des ressources (extraResources)
// En développement : utilise APP_ROOT/src/extraResources
// En production : utilise process.resourcesPath
export const getResourcesPath = () => {
    if (app.isPackaged && process.resourcesPath) {
        return process.resourcesPath
    }
    // En développement, utiliser le chemin du projet
    return path.join(APP_ROOT, 'src', 'extraResources')
}

// Get VITE_DEV_SERVER_URL from environment, with fallback
const VITE_DEV_SERVER_URL =
    process.env.VITE_DEV_SERVER_URL ||
    (process.env.NODE_ENV === 'development'
        ? 'http://localhost:5173'
        : undefined)

export { VITE_DEV_SERVER_URL }
export const MAIN_DIST = path.join(APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(APP_ROOT, 'dist')
export const DIST = path.join(APP_ROOT, 'dist')
// En production avec Electron Forge Vite, le renderer est dans .vite/renderer/main_window
export const RENDERER_HTML = app.isPackaged
    ? path.join(APP_ROOT, '.vite', 'renderer', 'main_window', 'index.html')
    : path.join(APP_ROOT, 'dist', 'index.html')
export const VITE_PUBLIC = VITE_DEV_SERVER_URL
    ? path.join(APP_ROOT, 'public')
    : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (process.platform === 'win32') app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
}

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = path.join(__dirname, 'preload.js')

// Store pour persister les préférences
const store = new Store({
    defaults: {
        language: 'en',
    },
})

// Fonction pour changer la langue
function changeLanguage(lang: string) {
    // Sauvegarder la langue dans le store
    store.set('language', lang)
    // Changer la langue dans i18next
    i18n.changeLanguage(lang)
    // Notifier toutes les fenêtres
    BrowserWindow.getAllWindows().forEach((window) => {
        window.webContents.send(channels.LANGUAGE_CHANGED, lang)
        window.webContents.send(channels.CHANGE_LANGUAGE_TO_FRONT, lang)
    })
    // Reconstruire le menu avec la nouvelle langue sélectionnée
    if (win) {
        buildMenu(app, win, i18n)
    }
}

// Handlers IPC pour la communication avec le renderer
ipcMain.handle(channels.CHANGE_LANGUAGE, (_event, lang: string) => {
    changeLanguage(lang)
})

ipcMain.handle(channels.GET_LANGUAGE, () => {
    return store.get('language') || 'en'
})

// Handlers IPC pour l'API store générique (comme dans l'ancienne application)
ipcMain.handle(channels.STORE_SET, (_event, key: string, value: unknown) => {
    store.set(key, value)
})

ipcMain.handle(
    channels.STORE_GET,
    (_event, key: string, defaultValue?: unknown) => {
        return store.get(key, defaultValue)
    }
)

ipcMain.handle(channels.STORE_DELETE, (_event, key: string) => {
    store.delete(key as any)
})

// Handler IPC pour l'initialisation (pour compatibilité avec l'ancien code)
ipcMain.handle(
    channels.INITIALIZATION_APP,
    async (_event, forceInitialisation = false) => {
        return await initialization(_event, forceInitialisation)
    }
)

// Handlers IPC pour les mesures
ipcMain.handle(
    channels.SIMPLE_MESURES,
    async (event, urlsList, localAdvConfig, envVars) => {
        return await handleSimpleCollect(
            event,
            urlsList,
            localAdvConfig,
            envVars
        )
    }
)

ipcMain.handle(
    channels.SAVE_JSON_FILE,
    async (event, jsonDatas, andCollect, envVars) => {
        return await handleJsonSaveAndCollect(
            event,
            jsonDatas,
            andCollect,
            envVars
        )
    }
)

ipcMain.handle(channels.READ_RELOAD_JSON_FILE, async (event) => {
    return await handleJsonReadAndReload(event)
})

ipcMain.handle(channels.SELECT_FOLDER, async (event) => {
    return await handleSelectFolder(event)
})

ipcMain.handle(channels.SELECT_PUPPETEER_FILE, async (event) => {
    return await handleSelectPuppeteerFilePath(event)
})

ipcMain.handle(channels.IS_JSON_CONFIG_FILE_EXIST, async (event, workDir) => {
    return await handleIsJsonConfigFileExist(event, workDir)
})

// Handler IPC pour tester l'auto-updater (uniquement en mode développement)
if (!app.isPackaged && process.platform !== 'linux') {
    ipcMain.handle(channels.TEST_UPDATE_DIALOG, async () => {
        const mainLog = getMainLog().scope('main/testUpdateDialog')
        try {
            mainLog.info('Test update dialog requested')
            const updater = Updater.getInstance()
            await updater.testUpdateDialog(false)
            return { success: true, message: 'Test dialog triggered' }
        } catch (error) {
            mainLog.error('Error testing update dialog:', error)
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            }
        }
    })
}

// Handler IPC pour afficher une boîte de dialogue de confirmation
ipcMain.handle(
    channels.SHOW_CONFIRM_DIALOG,
    async (
        _event,
        options: { title: string; message: string; buttons: string[] }
    ) => {
        const mainLog = getMainLog().scope('main/showConfirmDialog')
        try {
            // Utiliser la fenêtre principale ou la première fenêtre disponible
            const window =
                win ||
                BrowserWindow.getFocusedWindow() ||
                BrowserWindow.getAllWindows()[0]
            if (!window) {
                mainLog.error('No window available for showConfirmDialog')
                return false
            }
            const response = await dialog.showMessageBox(window, {
                type: 'question',
                title: options.title,
                message: options.title,
                detail: options.message,
                buttons: options.buttons,
                defaultId: 1, // Par défaut, le deuxième bouton (Continuer)
                cancelId: 0, // Le premier bouton (Annuler) annule la boîte de dialogue
            })
            // Retourne true si l'utilisateur a cliqué sur "Continuer" (index 1), false sinon
            return response.response === 1
        } catch (error) {
            mainLog.error('Error in showConfirmDialog', error)
            return false
        }
    }
)

async function createWindow() {
    win = new BrowserWindow({
        title: 'EcoindexApp',
        icon: path.join(VITE_PUBLIC, 'favicon.ico'),
        width: 1200,
        height: 800,
        webPreferences: {
            preload,
            // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
            // Consider using contextBridge.exposeInMainWorld
            // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
            nodeIntegration: false,
            contextIsolation: true,
        },
    })
    setMainWindow(win)

    // In development, always try to load from Vite dev server first
    if (VITE_DEV_SERVER_URL) {
        log.debug('Loading from Vite dev server:', VITE_DEV_SERVER_URL)
        win.loadURL(VITE_DEV_SERVER_URL)
        // Open devTool if the app is not packaged
        win.webContents.openDevTools()
    } else {
        log.debug('Loading from file:', RENDERER_HTML)
        log.debug('App path:', app.getAppPath())
        log.debug('Is packaged:', app.isPackaged)
        win.loadFile(RENDERER_HTML)
    }

    // Test actively push message to the Electron-Renderer
    win.webContents.on('did-finish-load', () => {
        const mainLog = getMainLog()
        mainLog.info('Window did-finish-load event fired')
        win?.webContents.send(
            channels.MAIN_PROCESS_MESSAGE,
            new Date().toLocaleString()
        )

        // Lancer l'initialisation automatiquement depuis le main process
        // Attendre un peu pour que la fenêtre soit complètement chargée et que les listeners soient enregistrés
        setTimeout(async () => {
            mainLog.info(
                'Starting automatic initialization from main process...'
            )
            try {
                // Créer un event factice pour l'initialisation
                const fakeEvent = {
                    sender: win?.webContents,
                } as any
                mainLog.debug('Calling initialization function...')

                const result = await initialization(fakeEvent, false)
                mainLog.info('Initialization completed with result:', result)
            } catch (error) {
                mainLog.error('Error during automatic initialization:', error)
                if (error instanceof Error) {
                    mainLog.error('Error stack:', error.stack)
                }
            }
        }, 1000)
    })

    // Handle errors
    win.webContents.on(
        'did-fail-load',
        (_event, errorCode, errorDescription) => {
            const mainLog = getMainLog()
            mainLog.error('Failed to load:', errorCode, errorDescription)
        }
    )
}

app.whenReady().then(async () => {
    // Initialiser i18next avant de créer le menu
    await initializeI18n()

    // Charger la langue depuis le store et l'appliquer AVANT l'initialisation
    const savedLanguage = (store.get('language') as string) || 'en'
    await i18n.changeLanguage(savedLanguage)
    const mainLog = getMainLog()
    mainLog.debug('Language loaded from store and applied:', savedLanguage)

    // Créer la fenêtre d'abord pour avoir mainWindow disponible
    await createWindow()
    // Créer le menu après que la fenêtre soit créée
    if (win) {
        buildMenu(app, win, i18n)
    }

    // Initialiser l'auto-update pour macOS et Windows
    if (process.platform !== 'linux') {
        const mainLog = getMainLog()
        mainLog.info('Initializing auto-updater for', process.platform)
        try {
            const updater = Updater.getInstance()
            // Vérifier les mises à jour au démarrage (mode silencieux)
            updater.checkForUpdates(true)
        } catch (error) {
            mainLog.error('Error initializing updater:', error)
        }
    }

    // Système de vérification Linux spécifique
    if (process.platform === 'linux') {
        const mainLog = getMainLog()
        const checkLinuxUpdater = async () => {
            try {
                // Extraire le repository depuis package.json
                const pkgAny = pkg as any
                let repoPath = 'hrenaud/EcoindexApp' // Valeur par défaut
                if (pkgAny.repository) {
                    if (typeof pkgAny.repository === 'string') {
                        const match = pkgAny.repository.match(
                            /github\.com[/:]([^/]+\/[^/]+)/
                        )
                        if (match) {
                            repoPath = match[1].replace(/\.git$/, '')
                        }
                    } else if (pkgAny.repository.url) {
                        const match = pkgAny.repository.url.match(
                            /github\.com[/:]([^/]+\/[^/]+)/
                        )
                        if (match) {
                            repoPath = match[1].replace(/\.git$/, '')
                        }
                    }
                }
                const url = `https://api.github.com/repos/${repoPath}/releases/latest`
                const tags = await fetch(url).then((_) => _.json())
                const currentVersion = pkg.version
                const lastVersion = tags['tag_name']
                if (currentVersion !== lastVersion) {
                    const lastVersionURL = tags['html_url']
                    mainLog.debug(`currentVersion`, currentVersion)
                    mainLog.debug(`lastVersion`, lastVersion)
                    mainLog.debug(`lastVersionURL`, lastVersionURL)
                    mainLog.debug(`Update Needed!`)
                    const linuxUpdate = new LinuxUpdate(
                        lastVersion,
                        lastVersionURL
                    )
                    if (win) {
                        win.webContents.send(
                            channels.ALERT_LINUX_UPDATE,
                            linuxUpdate
                        )
                    }
                }
            } catch (error) {
                mainLog.error('Error checking Linux update:', error)
            }
        }
        checkLinuxUpdater()
    }
})

app.on('window-all-closed', () => {
    win = null
    if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
    if (win) {
        // Focus on the main window if the user tried to open another
        if (win.isMinimized()) win.restore()
        win.focus()
    }
})

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows()
    if (allWindows.length) {
        allWindows[0].focus()
    } else {
        createWindow()
    }
})

// New window example arg: new windows url
app.on('browser-window-created', (_, window) => {
    window.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) {
            // shell.openExternal(url);
            return { action: 'deny' }
        }
        return { action: 'allow' }
    })
})
