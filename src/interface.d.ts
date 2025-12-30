import { ConfigData } from './class/ConfigData'
import { LinuxUpdate } from './class/LinuxUpdate'
import type { InitalizationMessage, ResultMessage } from './types'

// Types exportés pour utilisation dans les interfaces
export interface ISimpleUrlInput {
    value: string
}

export interface IKeyValue {
    [key: string]: string
}

export interface IAdvancedMesureData {
    'extra-header'?: object | null
    output: string[]
    'puppeteer-script'?: string
    'audit-category': string[]
    'output-path'?: string
    'user-agent'?: string
    'output-name'?: string
}

export interface ICourse {
    name: string
    target: string
    course: string
    'is-best-pages': boolean
    urls: string[] | ISimpleUrlInput[]
    urlSelector?: ISimpleUrlInput[]
}

export interface IJsonMesureData extends IAdvancedMesureData {
    courses: ICourse[]
}

export interface ISimpleMesureData extends IAdvancedMesureData {
    value: string
}

export interface IVersionsAPI {
    node: () => string
    chrome: () => string
    electron: () => string
    getNodeVersion: () => Promise<string>
}

export interface IStoreAPI {
    set: (key: string, value: any) => Promise<void>
    get: (key: string, defaultValue?: any) => Promise<string>
    delete: (key: string) => Promise<void>
}

export interface ILogAPI {
    // Front → Main
    sendLogToMain: (callback) => string
    // Main → Front
    sendLogToFront: (callback) => string
}

export interface IInteractionAPI {
    displaySplashScreen: (callback) => string
}

export interface IElectronAPI {
    // i18nextElectronBackend: any
    // Main → Front
    changeLanguageInFront: (callback: (lng: string) => void) => () => void
    sendLogToFront: (callback) => string
    sendMessageToFrontLog: (callback) => object
    sendDatasToFront: (callback: (data: any) => void) => () => void
    handleNewLinuxVersion: (
        callback: (linuxUpdate: LinuxUpdate) => void
    ) => () => void
    // Front → Main
    getInitialTranslations: () => Promise<object>
    handleSetFolderOuput: () => Promise<string>
    handleSelectFolder: () => Promise<string>
    handleSelectPuppeteerFilePath: () => Promise<string>
    getWorkDir: (newDir: string) => Promise<string>
    getHomeDir: () => Promise<string>
    isNodeInstalled: () => Promise<boolean>
    isLighthouseEcoindexPluginInstalled: () => Promise<ResultMessage>
    // handleLighthouseEcoindexPluginInstall: () => Promise<boolean>
    // handleLighthouseEcoindexPluginUpdate: () => Promise<boolean>
    // isLighthousePluginEcoindexMustBeInstallOrUpdated: () => Promise<ResultMessage>
    handleIsPuppeteerBrowserInstalled: () => Promise<boolean | string>
    handleSimpleMesures: (
        urlsList: ISimpleUrlInput[],
        localAdvConfig: IAdvancedMesureData,
        envVars: IKeyValue
    ) => Promise<string>
    handleJsonSaveAndCollect: (
        json: IJsonMesureData,
        andCollect: boolean,
        envVars: IKeyValue
    ) => Promise<string>
    handleJsonReadAndReload: () => Promise<IJsonMesureData>
    handleIsJsonConfigFileExist: (workDir: string) => Promise<boolean>
    showConfirmDialog: (options: {
        title: string
        message: string
        buttons: string[]
    }) => Promise<boolean>
    hideHelloWindow: () => Promise<void>
    // Méthodes pour la gestion de la langue (ajoutées pour le nouveau projet)
    changeLanguage: (lang: string) => Promise<void>
    getLanguage: () => Promise<string>
    onLanguageChanged: (callback: (lang: string) => void) => () => void
    // Méthode pour afficher le splash screen
    displaySplashScreen: (callback: (visibility: boolean) => void) => () => void
}

export interface IInitalization {
    // Front → Main
    initializeApplication: (forceInitialisation: boolean) => Promise<boolean>
    // Main → Front
    sendConfigDatasToFront: (callback: (data: ConfigData) => void) => () => void
    sendInitializationMessages: (
        callback: (message: InitalizationMessage) => void
    ) => () => void
}

declare global {
    // Types globaux (redéclarés pour compatibilité)
    interface IAdvancedMesureData {
        'extra-header': object | null
        output: string[]
        'puppeteer-script'?: string
        'audit-category': string[]
        'output-path'?: string
        'user-agent'?: string
        'output-name'?: string
    }
    interface IJsonMesureData extends IAdvancedMesureData {
        courses: ICourse[]
    }
    interface ISimpleMesureData extends IAdvancedMesureData {
        value: string
    }
    interface ICourse {
        name: string
        target: string
        course: string
        'is-best-pages': boolean
        urls: string[] | ISimpleUrlInput[]
        urlSelector?: ISimpleUrlInput[]
    }
    interface ISimpleUrlInput {
        value: string
    }
    interface IKeyValue {
        [key: string]: string
    }
    interface Window {
        versions: IVersionsAPI
        electronAPI: IElectronAPI
        store: IStoreAPI
        initialisationAPI: IInitalization
        interactionAPI: IInteractionAPI
    }
}
