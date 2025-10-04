import { channels } from '../../shared/constants'
import { getMainLog } from '../main'
import { getMainWindow } from '../memory'

/**
 * Send message to consol TextArea
 * @param message
 * @param optionalParams
 */
export const _sendMessageToFrontConsole = (
    message?: any,
    ...optionalParams: any[]
) => {
    const mainLog = getMainLog().scope('main/_sendMessageToFrontConsole')
    try {
        getMainWindow().webContents.send(
            channels.ASYNCHRONOUS_LOG,
            message,
            optionalParams
        )
    } catch (error) {
        mainLog.error('Error in _sendMessageToFrontConsole', error)
    }
}
