import { IpcMainEvent, IpcMainInvokeEvent } from 'electron'

import { ConfigData } from '../../../class/ConfigData'
import { channels } from '../../../shared/constants'
// import { checkIfMandatoryBrowserInstalled } from 'lighthouse-plugin-ecoindex-core/dist/install-browser.cjs'
import { getMainLog } from '../../main'
import { getMainWindow } from '../../memory'

/**
 * Initialization, Check if Puppeteer browsers are installed on host.
 * @param _event MainEvent.
 * @returns Promise&lt;ConfigData>
 */
export const initPuppeteerBrowserIsInstalled = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _event: IpcMainEvent | IpcMainInvokeEvent
) => {
    const mainLog = getMainLog().scope(
        'main/initialization/initPuppeteerBrowserIsInstalled'
    )
    const toReturned = new ConfigData('puppeteer_browser_installed')

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    try {
        const { default: checkIfMandatoryBrowserInstalled } = await import(
            'lighthouse-plugin-ecoindex-core/install-browser.cjs'
        )
        const browserInstalled = await checkIfMandatoryBrowserInstalled()
        if (browserInstalled) {
            toReturned.result = browserInstalled.buildId
            toReturned.message = `Puppeteer Browser installed=${browserInstalled.buildId}`
        } else {
            mainLog.error(
                `Error on initPuppeteerBrowserIsInstalled 🚫`,
                `browserInstalled not founded.`
            )
            toReturned.error = `Error on initPuppeteerBrowserIsInstalled 🚫`
            toReturned.message = `Error on initPuppeteerBrowserIsInstalled 🚫`
        }
    } catch (error) {
        mainLog.error(`Error on initPuppeteerBrowserIsInstalled 🚫`, error)
        toReturned.error = `Error on initPuppeteerBrowserIsInstalled 🚫`
        toReturned.message = `Error on initPuppeteerBrowserIsInstalled 🚫`
    }

    return new Promise<ConfigData>((resolve) => {
        getMainWindow().webContents.send(
            channels.HOST_INFORMATIONS_BACK,
            toReturned
        )
        resolve(toReturned)
    })
}
