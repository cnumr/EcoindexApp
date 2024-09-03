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
    const mainLog = getMainLog().scope('main/initialization')
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
        mainLog.log(`1. Node installed start...`)
        // #region Node installed
        const isNodeReturned = await initIsNodeInstalled(event)
        initializedDatas.initIsNodeInstalled = isNodeReturned.result as boolean
        mainLog.log(isNodeReturned)
        getMainWindow().webContents.send(
            channels.INITIALIZATION_DATAS,
            isNodeReturned
        )
        if (isNodeReturned.error) {
            mainLog.info(`Without Node, the app can't work. Stop and alert.`)
            const stopWithoutNode = new ConfigData('app_can_not_be_launched')
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
        if (isNodeReturned.error) {
            mainLog.info(`Without Node 20, the app can't work. Stop and alert.`)
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
        mainLog.log(`3. Get Npm Dir...`)
        // #region Npm Dir
        const getNpmDirReturned = await initSetNpmDir(event)
        initializedDatas.initSetNpmDir = getNpmDirReturned.result as string
        mainLog.log(getNpmDirReturned)
        if (getNpmDirReturned.error) {
            mainLog.info(`Without Npm Dir, the app can't work. Stop and alert.`)
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
        mainLog.log(`4. Get User HomeDir...`)
        // #region Home Dir
        const getHomeDirReturned = await initGetHomeDir(event)
        initializedDatas.initGetHomeDir = getHomeDirReturned.result as string
        mainLog.log(getHomeDirReturned)
        getMainWindow().webContents.send(
            channels.INITIALIZATION_DATAS,
            getHomeDirReturned
        )
        mainLog.log(`5. Get Last used WorkDir or fallback in User HomeDir ...`)
        // #region WorkDir
        const getWorkDirReturned = await initGetWorkDir(event)
        initializedDatas.initGetWorkDir = getWorkDirReturned.result as string
        mainLog.log(getWorkDirReturned)
        getMainWindow().webContents.send(
            channels.INITIALIZATION_DATAS,
            getWorkDirReturned
        )
        // #region User can install ?
        mainLog.log(`6. Check if user can install elements ...`)
        const getPluginCanInstallReturned = await initPluginCanInstall(event)
        initializedDatas.initPluginCanInstall =
            getPluginCanInstallReturned.result as boolean
        mainLog.log(getPluginCanInstallReturned)
        if (
            os.platform() === 'darwin' &&
            !initializedDatas.initPluginCanInstall
        ) {
            mainLog.debug(
                `os.platform() === 'darwin'`,
                os.platform() === 'darwin'
            )
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
        } else if (
            os.platform() !== 'darwin' &&
            !initializedDatas.initPluginCanInstall
        ) {
            mainLog.debug(
                `os.platform() !== 'darwin'`,
                os.platform() !== 'darwin'
            )
            mainLog.debug(
                `!initializedDatas.initPluginCanInstall`,
                !initializedDatas.initPluginCanInstall
            )
            // #region Can't Fix User rights
            const cantFixUserRights = new ConfigData(
                'app_can_not_be_launched',
                'error_type_cant_fix_user_rights'
            )
            cantFixUserRights.error = `Can't fix user rights`
            cantFixUserRights.message = `Need to fix user rights on ${os.platform()}`
            getMainWindow().webContents.send(
                channels.INITIALIZATION_DATAS,
                cantFixUserRights
            )
            return false
        } else {
            mainLog.log(`User can install plugins`)
        }
        // ...User can install
        mainLog.log(`7. Is a Puppeteer Browser installed ...`)
        // #region Puppeteer Browser Installed
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
                mainLog.log(
                    `7.b Verification Puppeteer installed after installation ...`
                )
                getPuppeteerBrowserIsInstalledReturned =
                    await initPuppeteerBrowserIsInstalled(event)
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

        mainLog.log(`8.1 Is a Plugin installed on host ...`)
        // #region Plugin Installed
        const getPluginIsInstalledReturned = await initPluginIsIntalled(event)
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
                pluginVersion.result = initializedDatas.initPluginGetLastVersion
                pluginVersion.message = pluginMessage
                getMainWindow().webContents.send(
                    channels.INITIALIZATION_DATAS,
                    pluginVersion
                )
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
            // } else {
            //     mainLog.log(`7.3 Electron CAN'T install plugin ...`)
            //     mainLog.log(`7.3 Plugin SUDO installation ...`)
            //     const getPluginSudoInstallationReturned =
            //         await initPluginSudoInstallation(event)
            //     initializedDatas.initPluginSudoInstallation =
            //         getPluginSudoInstallationReturned.result as boolean
            //     mainLog.log(getPluginSudoInstallationReturned)
            //     const sudoPluginInstallation = new ConfigData(
            //         'plugin_installed'
            //     )
            //     sudoPluginInstallation.result =
            //         initializedDatas.initPluginNormalInstallation
            //     sudoPluginInstallation.message =
            //         initializedDatas.initPluginNormalInstallation
            //             ? `Plugin installed`
            //             : `Installation plugin failed`
            //     getMainWindow().webContents.send(
            //         channels.INITIALIZATION_DATAS,
            //         sudoPluginInstallation
            //     )
            // }
            mainLog.log(`8.2 Plugin NOT installed on host ...`)
            mainLog.log(`8.3 Verify plugin version after install ...`)
            const getPluginGetLastVersionReturned =
                await initPluginGetLastVersion(event, `uninstalled`)
            initializedDatas.initPluginGetLastVersion =
                getPluginGetLastVersionReturned.result as string
            mainLog.log(getPluginGetLastVersionReturned)
            const pluginMessage = `Plugin version installed is ${initializedDatas.initPluginGetLastVersion}`
            const pluginVersion = new ConfigData('plugin_version')
            pluginVersion.result = initializedDatas.initPluginGetLastVersion
            pluginVersion.message = pluginMessage
            getMainWindow().webContents.send(
                channels.INITIALIZATION_DATAS,
                pluginVersion
            )
        }

        // #region END
        const appReady = new ConfigData('appReady')
        if (readInitalizedDatas(initializedDatas)) {
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
