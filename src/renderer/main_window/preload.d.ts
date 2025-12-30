import { IpcRendererEvent } from 'electron'

import type { ConfigData } from '@/class/ConfigData'
import type { InitalizationMessage } from '@/types'
import type {
    ISimpleUrlInput,
    IAdvancedMesureData,
    IJsonMesureData,
    IKeyValue,
} from '@/interface'

declare global {
    interface Window {
        ipcRenderer: {
            on(
                channel: string,
                listener: (event: IpcRendererEvent, ...args: any[]) => void
            ): void
            off(
                channel: string,
                listener: (event: IpcRendererEvent, ...args: any[]) => void
            ): void
            send(channel: string, ...args: any[]): void
            invoke(channel: string, ...args: any[]): Promise<any>
        }
        electronAPI: {
            changeLanguage: (lang: string) => Promise<void>
            getLanguage: () => Promise<string>
            onLanguageChanged: (callback: (lang: string) => void) => () => void
            displaySplashScreen: (
                callback: (visibility: boolean) => void
            ) => () => void
            handleNewLinuxVersion: (
                callback: (linuxUpdate: any) => void
            ) => () => void
            handleSimpleMesures: (
                urlsList: ISimpleUrlInput[],
                localAdvConfig: IAdvancedMesureData,
                envVars: IKeyValue
            ) => Promise<string>
            handleJsonSaveAndCollect: (
                jsonDatas: IJsonMesureData,
                andCollect: boolean,
                envVars: IKeyValue
            ) => Promise<string>
            handleJsonReadAndReload: () => Promise<IJsonMesureData>
            handleSelectFolder: () => Promise<string>
            handleSelectPuppeteerFilePath: () => Promise<string>
            handleIsJsonConfigFileExist: (workDir: string) => Promise<boolean>
            showConfirmDialog: (options: {
                title: string
                message: string
                buttons: string[]
            }) => Promise<boolean>
            sendDatasToFront: (callback: (data: any) => void) => () => void
            changeLanguageInFront: (
                callback: (lng: string) => void
            ) => () => void
        }
        store: {
            set: (key: string, value: unknown) => Promise<void>
            get: (key: string, defaultValue?: unknown) => Promise<unknown>
            delete: (key: string) => Promise<void>
        }
        initialisationAPI: {
            initializeApplication: (
                forceInitialisation: boolean
            ) => Promise<boolean>
            sendInitializationMessages: (
                callback: (message: InitalizationMessage) => void
            ) => () => void
            sendConfigDatasToFront: (
                callback: (data: ConfigData) => void
            ) => () => void
        }
        versions: {
            chrome: () => string
            node: () => string
            electron: () => string
        }
    }
}

export {}
