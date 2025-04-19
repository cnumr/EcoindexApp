import { IpcMainEvent, IpcMainInvokeEvent } from 'electron'

import { ConfigData } from '../../../class/ConfigData'
import { channels } from '../../../shared/constants'
import { getMainLog } from '../../main'
import { getMainWindow } from '../../memory'

// import { installMandatoryBrowser } from 'lighthouse-plugin-ecoindex-core/install-browser'

// import { installMandatoryBrowser } from 'lighthouse-plugin-ecoindex-core/dist/install-browser.cjs'

/**
 * Initialization, Install Puppeteer browsers on host.
 * @param _event MainEvent.
 * @returns Promise&lt;ConfigData>
 */
export const initPuppeteerBrowserInstallation = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _event: IpcMainEvent | IpcMainInvokeEvent
) => {
    const mainLog = getMainLog().scope(
        'main/initialization/initPuppeteerBrowserInstallation'
    )
    try {
        const toReturned = new ConfigData('puppeteer_browser_installation')
        // const { default: installMandatoryBrowser } = await import(
        //     'lighthouse-plugin-ecoindex-core/install-browser'
        // )
        const installMandatoryBrowser: any = null
        const browserInstalled = await installMandatoryBrowser()
        // const browserInstalled = await installMandatoryBrowser()
        return new Promise<ConfigData>((resolve) => {
            if (browserInstalled) {
                toReturned.result = true
                toReturned.message = `puppeteer and browsers are installed`
                getMainWindow().webContents.send(
                    channels.HOST_INFORMATIONS_BACK,
                    toReturned
                )
                return resolve(toReturned)
            } else {
                toReturned.error = `puppeteer and browsers can't be installed`
                toReturned.message = `puppeteer and browsers can't be installed`

                return resolve(toReturned)
            }
        })
    } catch (error) {
        mainLog.error(`Error on initPuppeteerBrowserInstallation 🚫`, error)
    }
}
