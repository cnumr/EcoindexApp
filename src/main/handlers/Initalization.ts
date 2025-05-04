import { IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import {
    channels,
    store as storeConstants,
    utils,
} from '../../shared/constants'
import {
    initPluginCanInstall,
    initSudoFixNpmDirRights,
} from './initHandlers/plugin_canInstall'

import { ConfigData } from '../../class/ConfigData'
import Store from 'electron-store'
import { getMainLog } from '../main'
import { getMainWindow } from '../memory'
import { initGetHomeDir } from './initHandlers/getHomeDir'
import { initGetWorkDir } from './initHandlers/getWorkDir'
import { initIsNodeInstalled } from './initHandlers/IsNodeInstalled'
import { initIsNodeNodeVersionOK } from './initHandlers/isNodeVersionOK'
import { initPluginGetLastVersion } from './initHandlers/plugin_getLastVersion'
import { initPluginIsIntalled } from './initHandlers/plugin_isInstalled'
import { initPluginNormalInstallation } from './initHandlers/plugin_installNormally'
import { initPuppeteerBrowserInstallation } from './initHandlers/puppeteerBrowser_installation'
import { initPuppeteerBrowserIsInstalled } from './initHandlers/puppeteerBrowser_isInstalled'
import { initSetNpmDir } from './initHandlers/setNpmDir'
import os from 'node:os'

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
    const checkNode = false
    const getHomeDir = true
    const getNpmDir = false
    const checkCanInstall = false
    const installCustomPlugin = false
    const installPuppeteer = true
    const forceAppReady = true
    const mainLog = getMainLog().scope('main/initialization')
    const updatePlugin = async () => {
        mainLog.log(`8.3 Plugin installation ...`)
        const getPluginNormalInstallationReturned =
            await initPluginNormalInstallation(event)
        initializedDatas.initPluginNormalInstallation =
            getPluginNormalInstallationReturned.result as boolean
        mainLog.log(getPluginNormalInstallationReturned)
        const normalPluginInstallation = new ConfigData('plugin_installed')
        normalPluginInstallation.result =
            initializedDatas.initPluginNormalInstallation
        normalPluginInstallation.message =
            initializedDatas.initPluginNormalInstallation
                ? `Plugin installed`
                : `Installation plugin failed`
        getMainWindow().webContents.send(
            channels.INITIALIZATION_DATAS,
            normalPluginInstallation
        )
    }
    mainLog.info(`forceInitialisation`, forceInitialisation)
    const initializedDatas: initializedDatas = {}
    try {
        mainLog.log(`Initialization start...`)
        // #region Check First launch
        // eslint-disable-next-line no-constant-condition
        if (false) {
            const sendFakeStop = new ConfigData(
                'app_can_not_be_launched',
                'error_type_cant_fix_user_rights'
            )
            getMainWindow().webContents.send(
                channels.INITIALIZATION_DATAS,
                sendFakeStop
            )
            return false
        }
        if (!forceInitialisation) {
            mainLog.log(`0. Is first launch?`)
            const hasBeenInstalledOnce = store.get(
                storeConstants.APP_INSTALLED_ONCE,
                false
            )
            if (!hasBeenInstalledOnce) {
                const firstLaunchDetected = new ConfigData(
                    'app_can_not_be_launched',
                    'error_type_first_install'
                )
                getMainWindow().webContents.send(
                    channels.INITIALIZATION_DATAS,
                    firstLaunchDetected
                )
                return false
            }
        } else {
            mainLog.info(`Installation asked manually for 1st installation.`)
            mainLog.debug(`forced mode started from button`)
        }
        // #region Node installed
        if (checkNode) {
            mainLog.log(`1. Node installed start...`)
            const isNodeReturned = await initIsNodeInstalled(event)
            initializedDatas.initIsNodeInstalled =
                isNodeReturned.result as boolean
            mainLog.log(isNodeReturned)
            getMainWindow().webContents.send(
                channels.INITIALIZATION_DATAS,
                isNodeReturned
            )
            if (isNodeReturned.error) {
                mainLog.info(
                    `Without Node, the app can't work. Stop and alert.`
                )
                const stopWithoutNode = new ConfigData(
                    'app_can_not_be_launched',
                    'error_type_no_node'
                )
                stopWithoutNode.error = `No Node installed`
                stopWithoutNode.message = `Without Node, the app can't work. Stop and alert.`
                getMainWindow().webContents.send(
                    channels.INITIALIZATION_DATAS,
                    stopWithoutNode
                )
                // stop all
                return false
            }
            mainLog.log(`2. Node Version upper or equal to 18 start...`)
            // #region Node has good version
            const isNode20Returned = await initIsNodeNodeVersionOK(event)
            initializedDatas.initIsNodeNodeVersionOK =
                isNode20Returned.result as boolean
            mainLog.log(isNode20Returned)
            getMainWindow().webContents.send(
                channels.INITIALIZATION_DATAS,
                isNode20Returned
            )
            if (isNode20Returned.error) {
                mainLog.info(
                    `Without Node 20, the app can't work. Stop and alert.`
                )
                const stopWithoutNode20 = new ConfigData(
                    'app_can_not_be_launched',
                    'error_type_node_version_error'
                )
                stopWithoutNode20.error = `No Node ${utils.LOWER_NODE_VERSION} installed`
                stopWithoutNode20.message = `Without Node ${utils.LOWER_NODE_VERSION}, the app can't work. Stop and alert.`
                getMainWindow().webContents.send(
                    channels.INITIALIZATION_DATAS,
                    stopWithoutNode20
                )
                // stop all
                return false
            }
        } else {
            mainLog.debug(`Skipped Check Node`)
        }
        // #region Npm Dir
        if (getNpmDir) {
            mainLog.log(`3. Get Npm Dir...`)
            const getNpmDirReturned = await initSetNpmDir(event)
            initializedDatas.initSetNpmDir = getNpmDirReturned.result as string
            mainLog.log(getNpmDirReturned)
            if (getNpmDirReturned.error) {
                mainLog.info(
                    `Without Npm Dir, the app can't work. Stop and alert.`
                )
                const stopWithoutNpmDir = new ConfigData(
                    'app_can_not_be_launched',
                    'error_type_no_npm_dir'
                )
                stopWithoutNpmDir.error = `No Npm dir founded`
                stopWithoutNpmDir.message = `Without Npm Dir, the app can't work. Stop and alert.`
                getMainWindow().webContents.send(
                    channels.INITIALIZATION_DATAS,
                    stopWithoutNpmDir
                )
                // stop all
                return false
            } else {
                getMainWindow().webContents.send(
                    channels.INITIALIZATION_DATAS,
                    getNpmDirReturned
                )
            }
        } else {
            mainLog.debug(`Skipped Get NPM Dir`)
        }
        // #region Home Dir
        if (getHomeDir) {
            mainLog.log(`4. Get User HomeDir...`)
            const getHomeDirReturned = await initGetHomeDir(event)
            initializedDatas.initGetHomeDir =
                getHomeDirReturned.result as string
            mainLog.log(getHomeDirReturned)
            getMainWindow().webContents.send(
                channels.INITIALIZATION_DATAS,
                getHomeDirReturned
            )
            mainLog.log(
                `5. Get Last used WorkDir or fallback in User HomeDir ...`
            )
            // #region WorkDir
            const getWorkDirReturned = await initGetWorkDir(event)
            initializedDatas.initGetWorkDir =
                getWorkDirReturned.result as string
            mainLog.log(getWorkDirReturned)
            getMainWindow().webContents.send(
                channels.INITIALIZATION_DATAS,
                getWorkDirReturned
            )
        } else {
            mainLog.debug(`Skipped Get Home Dir`)
        }
        // #region User can install ?
        if (checkCanInstall) {
            // disable node, node version and npmDir
            mainLog.log(`6. Check if user can install elements ...`)
            const getPluginCanInstallReturned =
                await initPluginCanInstall(event)
            initializedDatas.initPluginCanInstall =
                getPluginCanInstallReturned.result as boolean
            mainLog.log(getPluginCanInstallReturned)
            if (!initializedDatas.initPluginCanInstall) {
                mainLog.debug(`os.platform():`, os.platform())
                mainLog.debug(
                    `!initializedDatas.initPluginCanInstall`,
                    !initializedDatas.initPluginCanInstall
                )
                // #region Fix User rights
                const getSudoFixNpmDirRightsReturned =
                    await initSudoFixNpmDirRights(event)
                initializedDatas.initSudoFixNpmDirRights =
                    getSudoFixNpmDirRightsReturned.result as boolean
                mainLog.log(getSudoFixNpmDirRightsReturned)
                if (getSudoFixNpmDirRightsReturned.error) {
                    const errorOnFixingUserRights = new ConfigData(
                        'app_can_not_be_launched',
                        'error_type_cant_fix_user_rights'
                    )
                    errorOnFixingUserRights.error =
                        getSudoFixNpmDirRightsReturned.error.toString()
                    errorOnFixingUserRights.message = `Error on fixing user rights on ${os.platform()}.\n${getSudoFixNpmDirRightsReturned.error.toString()}`
                    getMainWindow().webContents.send(
                        channels.INITIALIZATION_DATAS,
                        errorOnFixingUserRights
                    )
                    mainLog.log(errorOnFixingUserRights)
                    return false
                }
            } else {
                mainLog.log(`User can install plugins`)
            }
        } else {
            mainLog.debug(`Skipped User can install`)
        }
        // ...User can install
        // #region Puppeteer Browser Installed
        if (installPuppeteer) {
            mainLog.log(`7. Is a Puppeteer Browser installed ...`)
            let getPuppeteerBrowserIsInstalledReturned =
                await initPuppeteerBrowserIsInstalled(event)
            initializedDatas.initPuppeteerBrowserIsInstalled =
                getPuppeteerBrowserIsInstalledReturned.result !== null
            // #region Puppeteer Browser Installation
            if (getPuppeteerBrowserIsInstalledReturned.error) {
                mainLog.log(`7.a Puppeteer Browser need to be installed ...`)
                const getPuppeteerBrowserInstallationReturned =
                    await initPuppeteerBrowserInstallation(event)
                // #region Puppeteer Browser Verification
                if (getPuppeteerBrowserInstallationReturned.result !== null) {
                    // mainLog.log('Waiting 10 seconds before verification...')
                    // await new Promise((resolve) => setTimeout(resolve, 10000))
                    mainLog.log(
                        `7.b Verification Puppeteer installed after installation ...`
                    )
                    getPuppeteerBrowserIsInstalledReturned =
                        await initPuppeteerBrowserIsInstalled(event)
                    mainLog.log(
                        `$$$$$$$$$$`,
                        getPuppeteerBrowserIsInstalledReturned
                    )
                    initializedDatas.initPuppeteerBrowserIsInstalled =
                        getPuppeteerBrowserIsInstalledReturned.result !== null
                }
            } else {
                mainLog.log(
                    `Puppeteer Browser allready installed, no need to install it`
                )
            }
            mainLog.log(getPuppeteerBrowserIsInstalledReturned)
            getMainWindow().webContents.send(
                channels.INITIALIZATION_DATAS,
                getPuppeteerBrowserIsInstalledReturned
            )
            if (getPuppeteerBrowserIsInstalledReturned.error) {
                mainLog.info(
                    `Without Puppeteer Browser, the app can't work. Stop and alert.`
                )
                const stopWithoutPuppeteerBrowser = new ConfigData(
                    'app_can_not_be_launched',
                    'error_type_browser_no_installed'
                )
                stopWithoutPuppeteerBrowser.error = `No Puppeteer Browser installed`
                stopWithoutPuppeteerBrowser.message = `Without Puppeteer Browser, the app can't work. Stop and alert.`
                getMainWindow().webContents.send(
                    channels.INITIALIZATION_DATAS,
                    stopWithoutPuppeteerBrowser
                )
                // stop all
                return false
            }
        } else {
            mainLog.debug(`Skipped User can install`)
        }
        // #region Plugin Installed
        if (installCustomPlugin) {
            // disable node, node version and npmDir
            mainLog.log(`8.1 Is a Plugin installed on host ...`)
            const getPluginIsInstalledReturned =
                await initPluginIsIntalled(event)
            initializedDatas.initPluginIsIntalled =
                getPluginIsInstalledReturned.result as string
            mainLog.log(getPluginIsInstalledReturned)
            // #region Plugin Last Version
            if (initializedDatas.initPluginIsIntalled) {
                // plugin installed
                mainLog.log(`8.2 Plugin is Installed on host ...`)
                mainLog.log(`8.2 Check plugin last version on registry ...`)
                const getPluginGetLastVersionReturned =
                    await initPluginGetLastVersion(
                        event,
                        initializedDatas.initPluginIsIntalled as string
                    )
                initializedDatas.initPluginGetLastVersion =
                    getPluginGetLastVersionReturned.result as string
                mainLog.log(getPluginGetLastVersionReturned)
                if (
                    initializedDatas.initPluginGetLastVersion ===
                    initializedDatas.initPluginIsIntalled
                ) {
                    const pluginMessage = `Plugin version installed is ${initializedDatas.initPluginGetLastVersion}`
                    const pluginOK = new ConfigData('plugin_installed')
                    pluginOK.result = true
                    pluginOK.message = pluginMessage
                    getMainWindow().webContents.send(
                        channels.INITIALIZATION_DATAS,
                        pluginOK
                    )
                    const pluginVersion = new ConfigData('plugin_version')
                    pluginVersion.result =
                        initializedDatas.initPluginGetLastVersion
                    pluginVersion.message = pluginMessage
                    getMainWindow().webContents.send(
                        channels.INITIALIZATION_DATAS,
                        pluginVersion
                    )
                } else {
                    await updatePlugin()
                }
            } else {
                // plugin not installed
                mainLog.log(`8.2 Plugin NOT installed on host ...`)
                mainLog.log(`8.2 Check if electron can install plugin ...`)
                const getPluginCanInstallReturned =
                    await initPluginCanInstall(event)
                initializedDatas.initPluginCanInstall =
                    getPluginCanInstallReturned.result as boolean
                mainLog.log(getPluginCanInstallReturned)
                // if (initializedDatas.initPluginCanInstall) {
                mainLog.log(`8.3 Electron install plugin ...`)
                mainLog.log(`8.3 Plugin installation ...`)
                const getPluginNormalInstallationReturned =
                    await initPluginNormalInstallation(event)
                initializedDatas.initPluginNormalInstallation =
                    getPluginNormalInstallationReturned.result as boolean
                mainLog.log(getPluginNormalInstallationReturned)
                const normalPluginInstallation = new ConfigData(
                    'plugin_installed'
                )
                normalPluginInstallation.result =
                    initializedDatas.initPluginNormalInstallation
                normalPluginInstallation.message =
                    initializedDatas.initPluginNormalInstallation
                        ? `Plugin installed`
                        : `Installation plugin failed`
                getMainWindow().webContents.send(
                    channels.INITIALIZATION_DATAS,
                    normalPluginInstallation
                )
                mainLog.log(`8.2 Plugin NOT installed on host ...`)
                await updatePlugin()
            }
        } else {
            mainLog.debug(`Skipped Plugin Installation`)
        }
        // #region END
        const appReady = new ConfigData('appReady')
        const isReady = forceAppReady || readInitalizedDatas(initializedDatas)
        if (isReady) {
            // TODO
            store.set(storeConstants.APP_INSTALLED_ONCE, true)
            appReady.result = true
            appReady.message = `All initialization process ended successfully`
            getMainWindow().webContents.send(
                channels.INITIALIZATION_DATAS,
                appReady
            )
            return true
        }
        appReady.error =
            appReady.message = `All initialization process ended successfully`
        getMainWindow().webContents.send(
            channels.INITIALIZATION_DATAS,
            appReady
        )
        return false
    } catch (error) {
        mainLog.error(error)
        return false
    }
}
