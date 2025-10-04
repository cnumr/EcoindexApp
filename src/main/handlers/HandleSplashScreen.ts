import { IpcMainEvent } from 'electron'
import Store from 'electron-store'
import { channels } from '../../shared/constants'
import { convertVersion } from '../../main/utils'
import { getMainLog } from '../main'
import { getMainWindow } from '../memory'
import pkg from '../../../package.json'

const store = new Store()

export const handleSplashScreen = async (
    event: IpcMainEvent,
    display: 'normal' | 'resetAndDisplay'
) => {
    const mainLog = getMainLog().scope('main/handleSplashScreen')
    const displayHello = `displayHello.${convertVersion(pkg.version)}`
    const displayHelloChecked = (await store.get(
        displayHello
    )) as unknown as boolean
    try {
        if (display === 'normal') {
            mainLog.info('Display splash screen')
            if (!displayHelloChecked) {
                getMainWindow().webContents.send(
                    channels.DISPLAY_SPLASH_SCREEN,
                    true
                )
            }
            return true
        }
        if (display === 'resetAndDisplay') {
            mainLog.info('Reset and display splash screen')
            await store.set(displayHello, false)
            getMainWindow().webContents.send(
                channels.DISPLAY_SPLASH_SCREEN,
                true
            )
            return true
        }
        mainLog.error('Do not display splash screen')
        return false
    } catch (error) {
        mainLog.error(error)
    }
}
