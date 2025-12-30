import { IpcMainEvent, IpcMainInvokeEvent, dialog } from 'electron'
import type { OpenDialogOptions } from 'electron'

import { getMainLog } from '../main'
import { setWorkDir } from '../memory'

/**
 * Handlers, SelectFolder
 * @param log Logger.MainLogger
 * @returns string
 */
export const handleSelectFolder = async (
    _event: IpcMainEvent | IpcMainInvokeEvent
) => {
    const mainLog = getMainLog().scope('main/handleSelectFolder')
    try {
        const options: OpenDialogOptions = {
            properties: ['openDirectory', 'createDirectory'],
        }
        const { canceled, filePaths } = await dialog.showOpenDialog(options)
        if (!canceled) {
            setWorkDir(`${filePaths[0]}`)
            return `${filePaths[0]}`
        }
    } catch {
        mainLog.error(`Error in handleSelectFolder`)
    }
}
