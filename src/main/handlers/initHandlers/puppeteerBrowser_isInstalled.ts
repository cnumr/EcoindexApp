import { IpcMainEvent, IpcMainInvokeEvent, utilityProcess } from 'electron'

import { ConfigData } from '../../../class/ConfigData'
import { _sendMessageToFrontConsole } from '../../utils/SendMessageToFrontConsole'
import { _sendMessageToFrontLog } from '../../utils/SendMessageToFrontLog'
import { channels } from '../../../shared/constants'
// import { checkIfMandatoryBrowserInstalled } from 'lighthouse-plugin-ecoindex-core/install-browser'
import { getMainLog } from '../../main'
import { getMainWindow } from '../../memory'
import path from 'path'

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
    try {
        await new Promise<void>((resolve, reject) => {
            mainLog.debug('Starting utility process...')
            const child = utilityProcess.fork(
                path.join(
                    __dirname,
                    '..',
                    '..',
                    'src',
                    'extraResources',
                    'browser',
                    'isInstalled.mjs'
                ),
                ['test'],
                {
                    stdio: ['ignore', 'pipe', 'pipe'],
                }
            )
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
                                if (message.data) {
                                    mainLog.info(`Returned DATA`, message.data)
                                    mainLog.info(
                                        `Complete: Puppeteer Browser installed=${message.data.browser} ${message.data.buildId}`
                                    )
                                    toReturned.result = message.data.buildId
                                    toReturned.message = `Puppeteer Browser installed=${message.data.browser} ${message.data.buildId}`
                                } else {
                                    mainLog.error(
                                        `Error: Puppeteer Browser not installed`
                                    )
                                    toReturned.error = `Error: Puppeteer Browser not installed`
                                    toReturned.message = `Error: Puppeteer Browser not installed`
                                }
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
                        toReturned.error = `Error on initPuppeteerBrowserIsInstalled 🚫`
                        toReturned.message = `Error on initPuppeteerBrowserIsInstalled 🚫`
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
        mainLog.error('Error in initPuppeteerBrowserIsInstalled', error)
        toReturned.error = `Error on initPuppeteerBrowserIsInstalled 🚫`
        toReturned.message = `Error on initPuppeteerBrowserIsInstalled 🚫`
        throw error
    }
}
