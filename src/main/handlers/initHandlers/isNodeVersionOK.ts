import { IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import { channels, utils } from '../../../shared/constants'
import { getMainWindow, getNodeDir, setNodeV } from '../../memory'

import { ConfigData } from '../../../class/ConfigData'
import Store from 'electron-store'
import { execFile } from 'child_process'
import { getMainLog } from '../../main'
import { resolveNodeBinary } from '../../utils-node'

const store = new Store()

/**
 * Initialization, Check if Node version is OK.
 * @param _event MainEvent.
 * @returns Promise&lt;ConfigData>
 */
export const initIsNodeNodeVersionOK = async (
    _event: IpcMainEvent | IpcMainInvokeEvent
) => {
    const mainLog = getMainLog().scope(
        'main/initialization/initIsNodeNodeVersionOK'
    )
    const toReturned = new ConfigData('node_version_is_ok')
    const tryReadVersion = async (): Promise<ConfigData> => {
        let nodePath: string | null = getNodeDir() || null
        if (!nodePath) nodePath = await resolveNodeBinary()
        if (!nodePath) {
            toReturned.error =
                toReturned.message = `Node version can't be detected`
            return toReturned
        }
        return await new Promise<ConfigData>((resolve) => {
            execFile(nodePath, ['-v'], (error, stdout, stderr) => {
                if (error) {
                    mainLog.error(error)
                    toReturned.error =
                        toReturned.message = `Node version can't be detected`
                    return resolve(toReturned)
                }
                if (stderr) mainLog.debug(`stderr: ${stderr}`)
                const returned: string = (stdout || '').trim()
                const major = returned.replace('v', '').split('.')[0]
                toReturned.result = Number(major) >= utils.LOWER_NODE_VERSION
                toReturned.message = returned
                setNodeV(returned)
                store.set(`nodeVersion`, returned)
                const mainWindow = getMainWindow()
                if (mainWindow) {
                    mainWindow.webContents.send(
                        channels.HOST_INFORMATIONS_BACK,
                        toReturned
                    )
                }
                return resolve(toReturned)
            })
        })
    }

    return await tryReadVersion()
}
