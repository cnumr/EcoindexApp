import { IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import { channels, store as storeConstants } from '../../shared/constants'

import { InitalizationData } from '../../class/InitalizationData'
import { InitalizationMessage } from '@/types'
import Store from 'electron-store'
import extractAsarLib from './HandleExtractAsarLib'
import { getMainLog } from '../main'
import { getMainWindow } from '../memory'
import { handleSplashScreen } from './HandleSplashScreen'
import i18n from '../../configs/i18next.config'
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
    return value.initIsNodeInstalled && value.initIsNodeNodeVersionOK
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

    mainLog.info(`forceInitialisation`, forceInitialisation)
    try {
        const nbsteps = 9
        const steps = isDarwin ? nbsteps : nbsteps + 1
        let currentStep = 1
        mainLog.log(`Initialization start...`)
        getMainWindow().webContents.send(channels.INITIALIZATION_MESSAGES, {
            type: 'message',
            modalType: 'started',
            title: `${i18n.t('initialization.title')}`,
            message: `${i18n.t('initialization.started')}`,
        })
        // attendre 5 secondes
        await new Promise((resolve) => setTimeout(resolve, 5000))

        // #region Check Node
        getMainWindow().webContents.send(channels.INITIALIZATION_MESSAGES, {
            type: 'message',
            modalType: 'started',
            title: `${currentStep}/${steps} - ${i18n.t('initialization.title')}`,
            message: `${i18n.t('initialization.node.check')}`,
        })
        mainLog.log(`${currentStep}. Check Node...`)
        const checkNodeReturned = await initIsNodeInstalled(event)
        initializedDatas.initIsNodeInstalled =
            checkNodeReturned.result as boolean
        mainLog.log(checkNodeReturned)
        getMainWindow().webContents.send(channels.INITIALIZATION_MESSAGES, {
            type: 'data',
            data: {
                type: InitalizationData.NODE_INSTALLED,
                result: checkNodeReturned.result,
            },
        })
        currentStep++
        // #endregion
        // #region Check Node Version
        getMainWindow().webContents.send(channels.INITIALIZATION_MESSAGES, {
            type: 'message',
            modalType: 'started',
            title: `${currentStep}/${steps} - ${i18n.t('initialization.title')}`,
            message: `${i18n.t('initialization.node.version')}`,
        })
        mainLog.log(`${currentStep}. Check Node Version...`)
        const checkNodeVersionReturned = await initIsNodeNodeVersionOK(event)
        initializedDatas.initIsNodeNodeVersionOK =
            checkNodeVersionReturned.result as boolean
        mainLog.log(checkNodeVersionReturned)
        getMainWindow().webContents.send(channels.INITIALIZATION_MESSAGES, {
            type: 'data',
            data: {
                type: InitalizationData.NODE_VERSION_OK,
                result: checkNodeVersionReturned.result,
            },
        })
        currentStep++
        // #endregion

        // #region Extraction pour windows
        if (!isDarwin) {
            getMainWindow().webContents.send(channels.INITIALIZATION_MESSAGES, {
                type: 'message',
                modalType: 'started',
                title: `${currentStep}/${steps} - ${i18n.t('initialization.title')}`,
                message: `${i18n.t('initialization.windows.unpacking')}`,
            })
            await extractAsarLib()
            currentStep++
        }
        // #endregion
        // #region Get User HomeDir
        getMainWindow().webContents.send(channels.INITIALIZATION_MESSAGES, {
            type: 'message',
            modalType: 'started',
            title: `${currentStep}/${steps} - ${i18n.t('initialization.title')}`,
            message: `${i18n.t('initialization.dir.home')}`,
        })

        mainLog.log(`${currentStep}. Get User HomeDir...`)
        const getHomeDirReturned = await initGetHomeDir(event)
        initializedDatas.initGetHomeDir = getHomeDirReturned.result as string
        mainLog.log(getHomeDirReturned)
        getMainWindow().webContents.send(channels.INITIALIZATION_MESSAGES, {
            type: 'data',
            data: {
                type: InitalizationData.HOMEDIR,
                result: getHomeDirReturned.result,
            },
        })
        currentStep++
        // #endregion
        // #region WorkDir
        // attendre 2 secondes
        await new Promise((resolve) => setTimeout(resolve, 2000))
        getMainWindow().webContents.send(channels.INITIALIZATION_MESSAGES, {
            type: 'message',
            modalType: 'started',
            title: `${currentStep}/${steps} - ${i18n.t('initialization.title')}`,
            message: `${i18n.t('initialization.dir.work')}`,
        })
        mainLog.log(
            `${currentStep}. Get Last used WorkDir or fallback in User HomeDir ...`
        )
        const getWorkDirReturned = await initGetWorkDir(event)
        initializedDatas.initGetWorkDir = getWorkDirReturned.result as string
        mainLog.log(getWorkDirReturned)
        getMainWindow().webContents.send(channels.INITIALIZATION_MESSAGES, {
            type: 'data',
            data: {
                type: InitalizationData.WORKDIR,
                result: getWorkDirReturned.result,
            },
        })
        currentStep++
        // #endregion
        // #region Puppeteer Browser Installed
        getMainWindow().webContents.send(channels.INITIALIZATION_MESSAGES, {
            type: 'message',
            modalType: 'started',
            title: `${currentStep}/${steps} - ${i18n.t('initialization.title')}`,
            message: `${i18n.t('initialization.browser-puppeteer.isInstalled')}`,
        })
        mainLog.log(`${currentStep}. Is a Puppeteer Browser installed ...`)
        let getPuppeteerBrowserIsInstalledReturned =
            await initPuppeteerBrowserIsInstalled(event)
        initializedDatas.initPuppeteerBrowserIsInstalled =
            getPuppeteerBrowserIsInstalledReturned.result !== null
        getMainWindow().webContents.send(channels.INITIALIZATION_MESSAGES, {
            type: 'data',
            data: {
                type: InitalizationData.PUPPETEER_BROWSER_INSTALLED,
                result: getPuppeteerBrowserIsInstalledReturned.result,
            },
        })
        currentStep++
        // #endregion
        // #region Puppeteer Browser Installation
        if (getPuppeteerBrowserIsInstalledReturned.error) {
            getMainWindow().webContents.send(channels.INITIALIZATION_MESSAGES, {
                type: 'message',
                modalType: 'started',
                title: `${currentStep}/${steps} - ${i18n.t('initialization.title')}`,
                message: `${i18n.t('initialization.browser-puppeteer.installation')}`,
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
                getMainWindow().webContents.send(
                    channels.INITIALIZATION_MESSAGES,
                    {
                        type: 'message',
                        modalType: 'started',
                        title: `${currentStep}/${steps} - ${i18n.t('initialization.title')}`,
                        message: `${i18n.t('initialization.browser-puppeteer.verification')}`,
                    }
                )
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
            getMainWindow().webContents.send(channels.INITIALIZATION_MESSAGES, {
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
            getMainWindow().webContents.send(channels.INITIALIZATION_MESSAGES, {
                type: 'data',
                data: {
                    type: InitalizationData.PUPPETEER_BROWSER_INSTALLED,
                    result: getPuppeteerBrowserIsInstalledReturned.result,
                },
            })
        }
        currentStep++
        // #endregion
        getMainWindow().webContents.send(channels.INITIALIZATION_MESSAGES, {
            type: 'message',
            modalType: 'completed',
            title: `${currentStep}/${steps} - ${i18n.t('initialization.title')}`,
            message: `${i18n.t('initialization.finished')}`,
        } as InitalizationMessage)

        const isReady = forceAppReady || readInitalizedDatas(initializedDatas)
        if (isReady) {
            // TODO
            store.set(storeConstants.APP_INSTALLED_ONCE, true)
            getMainWindow().webContents.send(channels.INITIALIZATION_MESSAGES, {
                type: 'data',
                data: {
                    type: InitalizationData.APP_READY,
                    result: true,
                },
            } as InitalizationMessage)
            handleSplashScreen(null, 'normal')
            return true
        }
        return false
    } catch (error) {
        mainLog.error(error)
        return false
    }
}
