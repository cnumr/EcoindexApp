import { IpcMainEvent, IpcMainInvokeEvent } from 'electron'

import { ConfigData } from '../../../class/ConfigData'
import { channels } from '../../../shared/constants'
import { exec } from 'child_process'
import { getMainLog } from '../../main'
import { getMainWindow } from '../../memory'

/**
 * Initialization, Read on registery the last version of the `lighthouse-plugin-ecoindex`.
 * @param _event MainEvent.
 * @param currentInstalledVersion The current version of `lighthouse-plugin-ecoindex` installed on host.
 * @returns Promise&lt;ConfigData>
 */
export const initPluginGetLastVersion = (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _event: IpcMainEvent | IpcMainInvokeEvent,
    currentInstalledVersion: string
) => {
    const mainLog = getMainLog().scope(
        'main/initialization/initPluginGetLastVersion'
    )
    mainLog.debug(
        `Check latest version of lighthouse-plugin-ecoindex on registry.`
    )
    /**
     * Dernière version sur le registry.
     */
    let latestVersion = ''
    const toReturned = new ConfigData('plugin_installed')
    return new Promise<ConfigData>((resolve) => {
        const cmd = `npm view lighthouse-plugin-ecoindex version`
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                mainLog.error(`exec error: ${error}`)
                toReturned.error =
                    toReturned.message = `lighthouse-plugin-ecoindex can't check on registery`
                // resolve(toReturned)
            }
            if (stderr) mainLog.debug(`stderr: ${stderr}`)
            if (stdout) {
                // mainLog.debug(`latest version: ${stdout.trim()}`)

                latestVersion = stdout.replace(`\n`, ``).trim()
                if (
                    currentInstalledVersion.trim() !==
                    stdout.replace(`\n`, ``).trim()
                ) {
                    toReturned.result = latestVersion.trim()
                    toReturned.message = `Update from version:${currentInstalledVersion.trim()} to latest version:${latestVersion.trim()} needed`
                    getMainWindow().webContents.send(
                        channels.HOST_INFORMATIONS_BACK,
                        toReturned
                    )
                    return resolve(toReturned)
                } else {
                    toReturned.result = latestVersion.trim()
                    toReturned.message = `lighthouse-plugin-ecoindex is up to date`
                    getMainWindow().webContents.send(
                        channels.HOST_INFORMATIONS_BACK,
                        toReturned
                    )
                    return resolve(toReturned)
                }
            }
        })
    })
}
