import { IpcMainEvent, IpcMainInvokeEvent, utilityProcess } from 'electron'

import { ConfigData } from '../../../class/ConfigData'
import { _sendMessageToFrontConsole } from '../../utils/SendMessageToFrontConsole'
import { _sendMessageToFrontLog } from '../../utils/SendMessageToFrontLog'
import { channels } from '../../../shared/constants'
import { getMainLog } from '../../main'
import { getMainWindow } from '../../memory'
import path from 'path'

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
    const toReturned = new ConfigData('puppeteer_browser_installation')

    try {
        await new Promise<void>((resolve, reject) => {
            mainLog.debug('Starting utility process...')
            const pathToScript =
                process.env['WEBPACK_SERVE'] === 'true'
                    ? path.join(
                          __dirname,
                          '..',
                          '..',
                          'lib',
                          'browser_install.mjs'
                      )
                    : path.join(
                          process.resourcesPath,
                          'lib.asar',
                          'browser_install.mjs'
                      )
            // pathToScript = path.join(__dirname, '..', '..', 'scripts', 'browser_install.mjs')
            // pathToScript = process.env['WEBPACK_SERVE'] === 'true'
            //         ? path.join(__dirname, '..', 'scripts', 'browser_isInstalled.mjs')
            //         : path.join(
            //             'app.asar', 'scripts', 'browser_isInstalled.mjs'
            //           )
            const child = utilityProcess.fork(pathToScript, ['test'], {
                stdio: ['ignore', 'pipe', 'pipe'],
            })
            let hasExited = false

            // Gérer les logs stdout
            if (child.stdout) {
                child.stdout.on('data', (data) => {
                    const all = /\n/g
                    const first = /^\n/
                    // Only remove the last newline characters (\n)
                    const last = /\n$/
                    // Only all the last newlines (\n)
                    const all_last = /\n+$/
                    const _data = data.toString().replace(all_last, '')
                    mainLog.debug(_data)
                    _sendMessageToFrontLog(_data)
                    _sendMessageToFrontConsole(_data)
                })
            }

            // Gérer les logs stderr
            if (child.stderr) {
                child.stderr.on('data', (data) => {
                    mainLog.error(`stderr: ${data.toString()}`)
                })
            }

            // Gérer les messages du processus enfant
            child.on('message', (message) => {
                mainLog.info('Message from child:', message)
                if (typeof message === 'object' && message !== null) {
                    if ('type' in message) {
                        switch (message.type) {
                            case 'progress':
                                mainLog.debug(`Progress: ${message.data}`)
                                break
                            case 'error':
                                mainLog.error(
                                    `Error from child: ${message.data}`
                                )
                                if (!hasExited) {
                                    hasExited = true
                                    reject(
                                        new Error(
                                            `Process error: ${message.data}`
                                        )
                                    )
                                }
                                break
                            case 'complete':
                                mainLog.info(`Complete: ${message.data}`)
                                toReturned.result = true
                                toReturned.message = `puppeteer and browsers are installed`
                                getMainWindow().webContents.send(
                                    channels.HOST_INFORMATIONS_BACK,
                                    toReturned
                                )
                                if (!hasExited) {
                                    hasExited = true
                                    resolve()
                                }
                                break
                            default:
                                mainLog.warn(`Unknown message type: ${message}`)
                        }
                    }
                }
            })

            // Gérer la fin du processus
            child.on('exit', (code: number) => {
                mainLog.log(`Child process exited with code ${code}`)
                if (!hasExited) {
                    hasExited = true
                    if (code === 0) {
                        mainLog.log('Process completed successfully')
                        resolve()
                    } else {
                        const error = new Error(
                            `Process exited with code ${code}`
                        )
                        mainLog.error('Process failed:', error)
                        toReturned.error = `puppeteer and browsers can't be installed 🚫`
                        toReturned.message = `puppeteer and browsers can't be installed 🚫`
                        reject(error)
                    }
                }
            })

            // Gérer le démarrage du processus
            child.on('spawn', () => {
                mainLog.log('Child process spawned successfully')
            })
        })
        return new Promise<ConfigData>((resolve) => {
            getMainWindow().webContents.send(
                channels.HOST_INFORMATIONS_BACK,
                toReturned
            )
            resolve(toReturned)
        })
    } catch (error) {
        mainLog.error('Error on initPuppeteerBrowserInstallation 🚫', error)
        toReturned.error = `Error on initPuppeteerBrowserInstallation 🚫`
        toReturned.message = `Error on initPuppeteerBrowserInstallation 🚫`
        throw error
    }
}
