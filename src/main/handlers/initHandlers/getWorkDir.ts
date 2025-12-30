import { IpcMainEvent, IpcMainInvokeEvent } from 'electron'

import { ConfigData } from '../../../class/ConfigData'
import Store from 'electron-store'
import { channels } from '../../../shared/constants'
import fs from 'node:fs'
import { getMainLog } from '../../main'
import { getMainWindow } from '../../memory'
import os from 'node:os'

const store = new Store()

/**
 * Initialization, get Work Dir.
 * @param _event MainEvent.
 * @returns Promise&lt;ConfigData>
 */
export const initGetWorkDir = (_event: IpcMainEvent | IpcMainInvokeEvent) => {
    const mainLog = getMainLog().scope('main/initialization/initGetWorkDir')
    const toReturned = new ConfigData('workDir')
    const { homedir } = os.userInfo()
    let lastWorkDir = store.get(`lastWorkDir`)
    if (!lastWorkDir) {
        store.set(`lastWorkDir`, homedir)
        lastWorkDir = homedir
    }
    try {
        fs.accessSync(lastWorkDir as string)
    } catch {
        store.set(`lastWorkDir`, homedir)
        lastWorkDir = homedir
        mainLog.info(`lastWorkDir unknown, fall back to homeDir`, lastWorkDir)
    }

    return new Promise<ConfigData>((resolve, reject) => {
        try {
            toReturned.result = lastWorkDir as string
            const mainWindow = getMainWindow()
            if (mainWindow) {
                mainWindow.webContents.send(
                    channels.HOST_INFORMATIONS_BACK,
                    toReturned
                )
            }
            resolve(toReturned)
        } catch {
            mainLog.error(`Error on initGetWorkDir 🚫`)
            toReturned.error = `Error on initGetWorkDir 🚫`
            toReturned.message = `Error on initGetWorkDir 🚫`
            const mainWindow = getMainWindow()
            if (mainWindow) {
                mainWindow.webContents.send(
                    channels.HOST_INFORMATIONS_BACK,
                    toReturned
                )
            }
            reject(toReturned)
        }
    })
}
