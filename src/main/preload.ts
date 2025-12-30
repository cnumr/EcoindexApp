import { contextBridge, ipcRenderer } from 'electron'
import type {
    ISimpleUrlInput,
    IAdvancedMesureData,
    IKeyValue,
    IJsonMesureData,
} from '../interface'
import { channels } from '../shared/constants'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
    on(...args: Parameters<typeof ipcRenderer.on>) {
        const [channel, listener] = args
        return ipcRenderer.on(channel, (event, ...args) =>
            listener(event, ...args)
        )
    },
    off(...args: Parameters<typeof ipcRenderer.off>) {
        const [channel, ...omit] = args
        return ipcRenderer.off(channel, ...omit)
    },
    send(...args: Parameters<typeof ipcRenderer.send>) {
        const [channel, ...omit] = args
        return ipcRenderer.send(channel, ...omit)
    },
    invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
        const [channel, ...omit] = args
        return ipcRenderer.invoke(channel, ...omit)
    },
    // You can expose other APTs for the renderer process here
})

// --------- Expose language API and Linux update API ---------
contextBridge.exposeInMainWorld('electronAPI', {
    changeLanguage: (lang: string) =>
        ipcRenderer.invoke(channels.CHANGE_LANGUAGE, lang),
    getLanguage: () => ipcRenderer.invoke(channels.GET_LANGUAGE),
    onLanguageChanged: (callback: (lang: string) => void) => {
        ipcRenderer.on(channels.LANGUAGE_CHANGED, (_event, lang: string) =>
            callback(lang)
        )
        return () => {
            ipcRenderer.removeAllListeners(channels.LANGUAGE_CHANGED)
        }
    },
    handleNewLinuxVersion: (callback: (linuxUpdate: any) => void) => {
        ipcRenderer.on(channels.ALERT_LINUX_UPDATE, (_event, linuxUpdate) =>
            callback(linuxUpdate)
        )
        return () => {
            ipcRenderer.removeAllListeners(channels.ALERT_LINUX_UPDATE)
        }
    },
    displaySplashScreen: (callback: (visibility: boolean) => void) => {
        ipcRenderer.on(
            channels.DISPLAY_SPLASH_SCREEN,
            (_event, visibility: boolean) => callback(visibility)
        )
        return () => {
            ipcRenderer.removeAllListeners(channels.DISPLAY_SPLASH_SCREEN)
        }
    },
    // Front → Main: Handlers pour les mesures
    handleSimpleMesures: (
        urlsList: ISimpleUrlInput[],
        localAdvConfig: IAdvancedMesureData,
        envVars: IKeyValue
    ) =>
        ipcRenderer.invoke(
            channels.SIMPLE_MESURES,
            urlsList,
            localAdvConfig,
            envVars
        ),
    handleJsonSaveAndCollect: (
        jsonDatas: IJsonMesureData,
        andCollect: boolean,
        envVars: IKeyValue
    ) =>
        ipcRenderer.invoke(
            channels.SAVE_JSON_FILE,
            jsonDatas,
            andCollect,
            envVars
        ),
    handleJsonReadAndReload: () =>
        ipcRenderer.invoke(channels.READ_RELOAD_JSON_FILE),
    handleSelectFolder: () => ipcRenderer.invoke(channels.SELECT_FOLDER),
    handleSelectPuppeteerFilePath: () =>
        ipcRenderer.invoke(channels.SELECT_PUPPETEER_FILE),
    handleIsJsonConfigFileExist: (workDir: string) =>
        ipcRenderer.invoke(channels.IS_JSON_CONFIG_FILE_EXIST, workDir),
    showConfirmDialog: (options: {
        title: string
        message: string
        buttons: string[]
    }) => ipcRenderer.invoke(channels.SHOW_CONFIRM_DIALOG, options),
    // Main → Front: Écouter les données depuis le main
    sendDatasToFront: (callback: (data: any) => void) => {
        ipcRenderer.on(channels.HOST_INFORMATIONS_BACK, (_event, data) =>
            callback(data)
        )
        return () => {
            ipcRenderer.removeAllListeners(channels.HOST_INFORMATIONS_BACK)
        }
    },
    changeLanguageInFront: (callback: (lng: string) => void) => {
        ipcRenderer.on(
            channels.CHANGE_LANGUAGE_TO_FRONT,
            (_event, lng: string) => callback(lng)
        )
        return () => {
            ipcRenderer.removeAllListeners(channels.CHANGE_LANGUAGE_TO_FRONT)
        }
    },
})

// --------- Expose store API (comme dans l'ancienne application) ---------
contextBridge.exposeInMainWorld('store', {
    set: (key: string, value: unknown) =>
        ipcRenderer.invoke(channels.STORE_SET, key, value),
    get: (key: string, defaultValue?: unknown) =>
        ipcRenderer.invoke(channels.STORE_GET, key, defaultValue),
    delete: (key: string) => ipcRenderer.invoke(channels.STORE_DELETE, key),
})

// --------- Expose versions API ---------
contextBridge.exposeInMainWorld('versions', {
    chrome: () => process.versions.chrome,
    node: () => process.versions.node,
    electron: () => process.versions.electron,
})

// --------- Expose initialization API ---------
contextBridge.exposeInMainWorld('initialisationAPI', {
    // Front → Main: Lancer l'initialisation (pour compatibilité, mais maintenant lancée automatiquement)
    initializeApplication: (forceInitialisation: boolean) =>
        ipcRenderer.invoke(channels.INITIALIZATION_APP, forceInitialisation),
    // Main → Front: Écouter les messages d'initialisation
    sendInitializationMessages: (callback: (message: any) => void) => {
        ipcRenderer.on(channels.INITIALIZATION_MESSAGES, (_event, message) =>
            callback(message)
        )
        return () => {
            ipcRenderer.removeAllListeners(channels.INITIALIZATION_MESSAGES)
        }
    },
    // Main → Front: Écouter les données de configuration
    sendConfigDatasToFront: (callback: (data: any) => void) => {
        // Écouter à la fois initialization-datas et host-informations-back
        const handler1 = (_event: any, data: any) => callback(data)
        const handler2 = (_event: any, data: any) => callback(data)

        ipcRenderer.on(channels.INITIALIZATION_DATAS, handler1)
        ipcRenderer.on(channels.HOST_INFORMATIONS_BACK, handler2)

        return () => {
            ipcRenderer.removeAllListeners(channels.INITIALIZATION_DATAS)
            ipcRenderer.removeAllListeners(channels.HOST_INFORMATIONS_BACK)
        }
    },
})
