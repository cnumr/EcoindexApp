import { IpcMainEvent, IpcMainInvokeEvent, dialog } from 'electron'

import { getMainLog } from '../main'

/**
 * Handlers, SelectFolder
 * @param log Logger.MainLogger
 * @returns string
 */
export const handleSelectPuppeteerFilePath = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _event: IpcMainEvent | IpcMainInvokeEvent
) => {
    const mainLog = getMainLog().scope('main/handleSelectPuppeteerFilePath')
    try {
        const options: Electron.OpenDialogOptions = {
            properties: ['openFile'],
            filters: [
                { name: 'JavaScript', extensions: ['js', 'mjs', 'cjs', 'ts'] },
            ],
        }
        const { canceled, filePaths } = await dialog.showOpenDialog(options)
        if (!canceled) {
            return `${filePaths[0]}`
        }
    } catch (error) {
        mainLog.error(`Error in handleSelectPuppeteerFilePath`)
    }
}
