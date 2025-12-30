import { IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import { getMainWindow, setNodeDir } from '../../memory'

import { ConfigData } from '../../../class/ConfigData'
import Store from 'electron-store'
import { channels } from '../../../shared/constants'
import { getMainLog } from '../../main'
import { resolveNodeBinary } from '../../utils-node'

const store = new Store()

/**
 * Initialization, Check if Node is installed on host.
 * @param _event MainEvent.
 * @returns Promise&lt;ConfigData>
 */
export const initIsNodeInstalled = async (
    _event: IpcMainEvent | IpcMainInvokeEvent
) => {
    const mainLog = getMainLog().scope(
        'main/initialization/initIsNodeInstalled'
    )
    // mainLog.debug(process.env.PATH)
    const toReturned = new ConfigData('node_installed')
    const nodePath = await resolveNodeBinary()
    if (!nodePath) {
        toReturned.result = false
        toReturned.error = toReturned.message = `Node can't be detected`
        return toReturned
    }
    mainLog.debug(`Node path: ${nodePath}`)
    toReturned.result = true
    toReturned.message = `Node is Installed in ${nodePath}`
    setNodeDir(nodePath)
    store.set(`nodeDir`, nodePath)
    const mainWindow = getMainWindow()
    if (mainWindow) {
        mainWindow.webContents.send(channels.HOST_INFORMATIONS_BACK, toReturned)
    }
    return toReturned
}
