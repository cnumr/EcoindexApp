import { IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import {
    channels,
    store as storeConstants,
    utils,
} from '../../shared/constants'

import {
    InitalizationData,
    type InitalizationDataType,
} from '../../class/InitalizationData'
import { InitalizationMessage } from '@/types'
import Store from 'electron-store'
import extractAsarLib from './initHandlers/HandleExtractAsarLib'
import { getMainLog } from '../main'
import { getMainWindow } from '../memory'
import i18n, { initializeI18n } from '../../configs/i18next.config'
import { initGetHomeDir } from './initHandlers/getHomeDir'
import { initGetWorkDir } from './initHandlers/getWorkDir'
import { initIsNodeInstalled } from './initHandlers/IsNodeInstalled'
import { initIsNodeNodeVersionOK } from './initHandlers/isNodeVersionOK'
import { initPuppeteerBrowserInstallation } from './initHandlers/puppeteerBrowser_installation'
import { initPuppeteerBrowserIsInstalled } from './initHandlers/puppeteerBrowser_isInstalled'

const store = new Store()

type initializedDatas = {
    initIsNodeInstalled?: boolean
    initIsNodeNodeVersionOK?: boolean
    initGetHomeDir?: string
    initGetWorkDir?: string
    initSetNpmDir?: string
    initPuppeteerBrowserIsInstalled?: boolean
    initPluginIsIntalled?: boolean | string
    initPluginCanInstall?: boolean
    initSudoFixNpmDirRights?: boolean
    initPluginGetLastVersion?: string
    initPluginNormalInstallation?: boolean
    initPluginSudoInstallation?: boolean
}

const readInitalizedDatas = (value: initializedDatas): boolean => {
    return !!(value.initIsNodeInstalled && value.initIsNodeNodeVersionOK)
}

const sendInitializationMessage = (message: InitalizationMessage) => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
        mainWindow.webContents.send(channels.INITIALIZATION_MESSAGES, message)
    }
}

/**
 * Launch initialization of the app (installs and checks).
 * @param event Electron event
 * @param forceInitialisation Force installation instead of scope not set.
 * @returns
 */
export const initialization = async (
    event: IpcMainEvent | IpcMainInvokeEvent,
    forceInitialisation = false
) => {
    const forceAppReady = true
    const isDarwin = process.platform === 'darwin'
    const mainLog = getMainLog().scope('main/initialization')
    const initializedDatas: initializedDatas = {}

    mainLog.info(
        'Initialization function called, forceInitialisation:',
        forceInitialisation
    )

    try {
        // S'assurer que i18next est initialisé et que les traductions sont chargées
        mainLog.debug('Initializing i18next...')
        await initializeI18n()
        mainLog.debug('i18next initialized successfully')

        // Charger la langue depuis le store si elle n'est pas déjà chargée
        const savedLanguage = (store.get('language') as string) || 'en'
        if (i18n.language !== savedLanguage) {
            await i18n.changeLanguage(savedLanguage)
            mainLog.debug('Language changed to:', savedLanguage)
        }

        const nbsteps = 9
        const steps = isDarwin ? nbsteps : nbsteps + 1
        let currentStep = 1
        mainLog.log(`Initialization start...`)
        sendInitializationMessage({
            type: 'message',
            modalType: 'started',
            title: `${i18n.t('initialization.title')}`,
            message: `${i18n.t('initialization.started')}`,
            step: currentStep,
            steps: steps,
        })
        // attendre 5 secondes
        await new Promise((resolve) => setTimeout(resolve, 5000))

        // #region Check Node
        sendInitializationMessage({
            type: 'message',
            modalType: 'started',
            title: `${currentStep}/${steps} - ${i18n.t('initialization.title')}`,
            message: `${i18n.t('initialization.node.check')}`,
            step: currentStep,
            steps: steps,
        })
        mainLog.log(`${currentStep}. Check Node...`)
        const checkNodeReturned = await initIsNodeInstalled(event)
        initializedDatas.initIsNodeInstalled =
            checkNodeReturned.result as boolean
        mainLog.log(checkNodeReturned)
        if (!initializedDatas.initIsNodeInstalled) {
            sendInitializationMessage({
                type: 'message',
                modalType: 'error',
                title: `${i18n.t('initialization.fatal.error')}`,
                message: `${i18n.t('initialization.node.error.notinstalled')}`,
                errorLink: {
                    label: `${i18n.t('initialization.node.install.Label')}`,
                    url: utils.DOWNLOAD_NODE_LINK,
                },
            })
            return false
        }
        sendInitializationMessage({
            type: 'data',
            modalType: 'completed',
            title: '',
            message: '',
            data: {
                type: InitalizationData.NODE_INSTALLED as InitalizationDataType,
                result:
                    checkNodeReturned.result !== null &&
                    checkNodeReturned.result !== undefined
                        ? String(checkNodeReturned.result)
                        : '',
            },
        } as InitalizationMessage)
        currentStep++
        // #endregion
        // #region Check Node Version
        sendInitializationMessage({
            type: 'message',
            modalType: 'started',
            title: `${currentStep}/${steps} - ${i18n.t('initialization.title')}`,
            message: `${i18n.t('initialization.node.version')}`,
            step: currentStep,
            steps: steps,
        })
        mainLog.log(`${currentStep}. Check Node Version...`)
        const checkNodeVersionReturned = await initIsNodeNodeVersionOK(event)
        initializedDatas.initIsNodeNodeVersionOK =
            checkNodeVersionReturned.result as boolean
        mainLog.log(checkNodeVersionReturned)
        if (!initializedDatas.initIsNodeNodeVersionOK) {
            sendInitializationMessage({
                type: 'message',
                modalType: 'error',
                title: `${i18n.t('initialization.fatal.error')}`,
                message: `${i18n.t('initialization.node.error.wrongversion')} (min. ≥${utils.LOWER_NODE_VERSION})`,
                errorLink: {
                    label: `${i18n.t('initialization.node.install.Label')}`,
                    url: utils.DOWNLOAD_NODE_LINK,
                },
            })
            return false
        }
        sendInitializationMessage({
            type: 'data',
            modalType: 'completed',
            title: '',
            message: '',
            data: {
                type: InitalizationData.NODE_VERSION_OK as InitalizationDataType,
                result:
                    checkNodeVersionReturned.result !== null &&
                    checkNodeVersionReturned.result !== undefined
                        ? String(checkNodeVersionReturned.result)
                        : '',
            },
        } as InitalizationMessage)
        currentStep++
        // #endregion

        // #region Extraction pour windows
        if (!isDarwin) {
            sendInitializationMessage({
                type: 'message',
                modalType: 'started',
                title: `${currentStep}/${steps} - ${i18n.t('initialization.title')}`,
                message: `${i18n.t('initialization.windows.unpacking')}`,
                step: currentStep,
                steps: steps,
            })
            await extractAsarLib()
            currentStep++
        }
        // #endregion
        // #region Get User HomeDir
        sendInitializationMessage({
            type: 'message',
            modalType: 'started',
            title: `${currentStep}/${steps} - ${i18n.t('initialization.title')}`,
            message: `${i18n.t('initialization.dir.home')}`,
            step: currentStep,
            steps: steps,
        })

        mainLog.log(`${currentStep}. Get User HomeDir...`)
        const getHomeDirReturned = await initGetHomeDir(event)
        initializedDatas.initGetHomeDir = getHomeDirReturned.result as string
        mainLog.log(getHomeDirReturned)
        sendInitializationMessage({
            type: 'data',
            modalType: 'completed',
            title: '',
            message: '',
            data: {
                type: InitalizationData.HOMEDIR as InitalizationDataType,
                result:
                    getHomeDirReturned.result !== null &&
                    getHomeDirReturned.result !== undefined
                        ? String(getHomeDirReturned.result)
                        : '',
            },
        } as InitalizationMessage)
        currentStep++
        // #endregion
        // #region WorkDir
        // attendre 2 secondes
        await new Promise((resolve) => setTimeout(resolve, 2000))
        sendInitializationMessage({
            type: 'message',
            modalType: 'started',
            title: `${currentStep}/${steps} - ${i18n.t('initialization.title')}`,
            message: `${i18n.t('initialization.dir.work')}`,
            step: currentStep,
            steps: steps,
        })
        mainLog.log(
            `${currentStep}. Get Last used WorkDir or fallback in User HomeDir ...`
        )
        const getWorkDirReturned = await initGetWorkDir(event)
        initializedDatas.initGetWorkDir = getWorkDirReturned.result as string
        mainLog.log(getWorkDirReturned)
        sendInitializationMessage({
            type: 'data',
            modalType: 'completed',
            title: '',
            message: '',
            data: {
                type: InitalizationData.WORKDIR as InitalizationDataType,
                result:
                    getWorkDirReturned.result !== null &&
                    getWorkDirReturned.result !== undefined
                        ? String(getWorkDirReturned.result)
                        : '',
            },
        } as InitalizationMessage)
        currentStep++
        // #endregion
        // #region Puppeteer Browser Installed
        sendInitializationMessage({
            type: 'message',
            modalType: 'started',
            title: `${currentStep}/${steps} - ${i18n.t('initialization.title')}`,
            message: `${i18n.t('initialization.browser-puppeteer.isInstalled')}`,
            step: currentStep,
            steps: steps,
        })
        mainLog.log(`${currentStep}. Is a Puppeteer Browser installed ...`)
        let getPuppeteerBrowserIsInstalledReturned =
            await initPuppeteerBrowserIsInstalled(event)
        initializedDatas.initPuppeteerBrowserIsInstalled =
            getPuppeteerBrowserIsInstalledReturned.result !== null
        sendInitializationMessage({
            type: 'data',
            modalType: 'completed',
            title: '',
            message: '',
            data: {
                type: InitalizationData.PUPPETEER_BROWSER_INSTALLED as InitalizationDataType,
                result:
                    getPuppeteerBrowserIsInstalledReturned.result !== null &&
                    getPuppeteerBrowserIsInstalledReturned.result !== undefined
                        ? String(getPuppeteerBrowserIsInstalledReturned.result)
                        : '',
            },
        } as InitalizationMessage)
        currentStep++
        // #endregion
        // #region Puppeteer Browser Installation
        if (getPuppeteerBrowserIsInstalledReturned.error) {
            sendInitializationMessage({
                type: 'message',
                modalType: 'started',
                title: `${currentStep}/${steps} - ${i18n.t('initialization.title')}`,
                message: `${i18n.t('initialization.browser-puppeteer.installation')}`,
                step: currentStep,
                steps: steps,
            })
            mainLog.log(
                `${currentStep}.a Puppeteer Browser need to be installed ...`
            )
            const getPuppeteerBrowserInstallationReturned =
                await initPuppeteerBrowserInstallation(event)
            currentStep++
            // #endregion
            // #region Puppeteer Browser Verification
            if (getPuppeteerBrowserInstallationReturned.result !== null) {
                // mainLog.log('Waiting 10 seconds before verification...')
                // await new Promise((resolve) => setTimeout(resolve, 10000))
                sendInitializationMessage({
                    type: 'message',
                    modalType: 'started',
                    title: `${currentStep}/${steps} - ${i18n.t('initialization.title')}`,
                    message: `${i18n.t('initialization.browser-puppeteer.verification')}`,
                    step: currentStep,
                    steps: steps,
                })
                mainLog.log(
                    `${currentStep}.b Verification Puppeteer installed after installation ...`
                )
                getPuppeteerBrowserIsInstalledReturned =
                    await initPuppeteerBrowserIsInstalled(event)
                mainLog.log(
                    `$$$$$$$$$$`,
                    getPuppeteerBrowserIsInstalledReturned
                )
                initializedDatas.initPuppeteerBrowserIsInstalled =
                    getPuppeteerBrowserIsInstalledReturned.result !== null
                currentStep++
            } else {
                currentStep++
            }
        } else {
            // no need to install it
            currentStep++
            // no need to verify it
            currentStep++
            mainLog.log(
                `Puppeteer Browser allready installed, no need to install it`
            )
        }
        mainLog.log(getPuppeteerBrowserIsInstalledReturned)

        if (getPuppeteerBrowserIsInstalledReturned.error) {
            mainLog.info(
                `Without Puppeteer Browser, the app can't work. Stop and alert.`
            )
            sendInitializationMessage({
                type: 'message',
                modalType: 'error',
                title: `${i18n.t('initialization.title-error')}`,
                message: `${i18n.t('initialization.browser-puppeteer.error')}`,
                data: {
                    type: InitalizationData.APP_CAN_NOT_BE_LAUNCHED,
                    result: `${i18n.t('initialization.browser-puppeteer.error')}`,
                },
            } as InitalizationMessage)
            // stop all
            return false
        } else {
            sendInitializationMessage({
                type: 'data',
                modalType: 'completed',
                title: '',
                message: '',
                data: {
                    type: InitalizationData.PUPPETEER_BROWSER_INSTALLED as InitalizationDataType,
                    result:
                        getPuppeteerBrowserIsInstalledReturned.result !==
                            null &&
                        getPuppeteerBrowserIsInstalledReturned.result !==
                            undefined
                            ? String(
                                  getPuppeteerBrowserIsInstalledReturned.result
                              )
                            : '',
                },
            } as InitalizationMessage)
        }
        currentStep++
        // #endregion
        sendInitializationMessage({
            type: 'message',
            modalType: 'completed',
            title: `${currentStep}/${steps} - ${i18n.t('initialization.title')}`,
            message: `${i18n.t('initialization.finished')}`,
        } as InitalizationMessage)

        const isReady = forceAppReady || readInitalizedDatas(initializedDatas)
        if (isReady) {
            mainLog.info('Application initialized successfully')
            store.set(storeConstants.APP_INSTALLED_ONCE, true)
            sendInitializationMessage({
                type: 'data',
                data: {
                    type: InitalizationData.APP_READY as InitalizationDataType,
                    result: true,
                },
            } as InitalizationMessage)
            // Attendre que la popin d'initialisation se ferme (2 secondes + marge)
            await new Promise((resolve) => setTimeout(resolve, 2500))
            // Afficher le splash screen après la fermeture de la popin
            const { handleSplashScreen } =
                await import('./initHandlers/HandleSplashScreen')
            await handleSplashScreen(null, 'normal')
            return true
        }
        return false
    } catch (error) {
        mainLog.error(error)
        return false
    }
}
