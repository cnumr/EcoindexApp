// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron'

import { channels } from '../../shared/constants'

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    // Front → Main
    getNodeVersion: () => ipcRenderer.invoke(channels.GET_NODE_VERSION),
})

contextBridge.exposeInMainWorld('initialisationAPI', {
    // Front → Main
    initializeApplication: (forceInitialisation: boolean) =>
        ipcRenderer.invoke(channels.INITIALIZATION_APP, forceInitialisation),
    // Main → Front
    sendConfigDatasToFront: (callback: any) =>
        ipcRenderer.on(channels.INITIALIZATION_DATAS, (_event, value) =>
            callback(value)
        ),
    sendInitializationMessages: (callback: any) =>
        ipcRenderer.on(channels.INITIALIZATION_MESSAGES, (_event, message) =>
            callback(message)
        ),
})
contextBridge.exposeInMainWorld('electronAPI', {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // Front → Main
    // simple handlers
    handleSimpleMesures: (urlsList: ISimpleUrlInput[]) =>
        ipcRenderer.invoke(channels.SIMPLE_MESURES, urlsList),
    // json handlers
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

    // communs handlers and getters
    handleSelectFolder: () => ipcRenderer.invoke(channels.SELECT_FOLDER),
    handleSelectPuppeteerFilePath: () =>
        ipcRenderer.invoke(channels.SELECT_PUPPETEER_FILE),
    getWorkDir: (newDir: string) =>
        ipcRenderer.invoke(channels.GET_WORKDIR, newDir),
    getHomeDir: () => ipcRenderer.invoke(channels.GET_HOMEDIR),
    isLighthouseEcoindexPluginInstalled: () =>
        ipcRenderer.invoke(channels.IS_LIGHTHOUSE_ECOINDEX_INSTALLED),
    // isLighthousePluginEcoindexMustBeInstallOrUpdated: () =>
    //   ipcRenderer.invoke(channels.INSTALL_LIGHTHOUSE_PLUGIN_ECOINDEX),
    isNodeInstalled: () => ipcRenderer.invoke(channels.IS_NODE_INSTALLED),
    handleIsJsonConfigFileExist: (workDir: string) =>
        ipcRenderer.invoke(channels.IS_JSON_CONFIG_FILE_EXIST, workDir),
    //   handleLighthouseEcoindexPluginInstall: () =>
    //     ipcRenderer.invoke(channels.INSTALL_ECOINDEX_PLUGIN),
    //   handleLighthouseEcoindexPluginUpdate: () =>
    //     ipcRenderer.invoke(channels.UPDATE_ECOINDEX_PLUGIN),
    handleIsPuppeteerBrowserInstalled: () =>
        ipcRenderer.invoke(channels.INSTALL_PUPPETEER_BROWSER),

    // Main → Front
    sendLogToFront: (callback: any) =>
        ipcRenderer.on(channels.ASYNCHRONOUS_LOG, (_event, value) =>
            callback(value)
        ),
    // sendJsonDatasToFront: (callback: any) =>
    //   ipcRenderer.on(channels.READED_JSON_FILE, (_event, value) =>
    //     callback(value),
    //   ),
    sendMessageToFrontLog: (callback: any) =>
        ipcRenderer.on(
            channels.HOST_INFORMATIONS,
            (_event, message, optionalParams) =>
                callback(message, optionalParams)
        ),
    sendDatasToFront: (callback: any) =>
        ipcRenderer.on(
            channels.HOST_INFORMATIONS_BACK,
            (_event, message, optionalParams) =>
                callback(message, optionalParams)
        ),
    changeLanguageInFront: (callback: any) =>
        ipcRenderer.on(
            channels.CHANGE_LANGUAGE_TO_FRONT,
            (_event, languageCode) => callback(languageCode)
        ),
    handleNewLinuxVersion: (callback: any) =>
        ipcRenderer.on(channels.ALERT_LINUX_UPDATE, (_event, linuxUpdate) =>
            callback(linuxUpdate)
        ),
})

contextBridge.exposeInMainWorld('store', {
    set: (key: string, value: any) =>
        ipcRenderer.invoke('store-set', key, value),
    get: (key: string, defaultValue: any) =>
        ipcRenderer.invoke('store-get', key, defaultValue),
    delete: (key: string) => ipcRenderer.invoke('store-delete', key),
})

contextBridge.exposeInMainWorld('interactionAPI', {
    // Main → Front
    displaySplashScreen: (callback: any) =>
        ipcRenderer.on(channels.DISPLAY_SPLASH_SCREEN, (_event, message) =>
            callback(message)
        ),
})
