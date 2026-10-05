import { IpcMainEvent, IpcMainInvokeEvent, app, utilityProcess } from 'electron'

import { ConfigData } from '../../../class/ConfigData'
import { _sendMessageToFrontLog } from '../../utils/SendMessageToFrontLog'
import { channels } from '../../../shared/constants'
import { getMainLog } from '../../main'
import { getMainWindow } from '../../memory'
import path from 'path'
import { resolvePackagedLibScriptPath } from '../../utils/resolveLibScriptPath'

/**
 * Initialization, Install Puppeteer browsers on host.
 * @param _event MainEvent.
 * @returns Promise&lt;ConfigData>
 */
export const initPuppeteerBrowserInstallation = async (
    _event: IpcMainEvent | IpcMainInvokeEvent
) => {
    const mainLog = getMainLog().scope(
        'main/initialization/initPuppeteerBrowserInstallation'
    )
    const toReturned = new ConfigData('puppeteer_browser_installation')

    try {
        await new Promise<void>((resolve, reject) => {
            mainLog.debug('Starting utility process...')
            // Déterminer le chemin du script
            // En développement (non packagé), utiliser le dossier lib du projet
            // En production, utiliser process.resourcesPath (qui pointe vers les ressources de l'app)
            let pathToScript: string
            if (!app.isPackaged || process.env['WEBPACK_SERVE'] === 'true') {
                // En développement : utiliser le dossier lib du projet
                pathToScript = path.join(
                    process.cwd(),
                    'lib',
                    'browser_install.mjs'
                )
                mainLog.debug(`Using development path: ${pathToScript}`)
            } else if (process.resourcesPath) {
                // En production packagée : utiliser process.resourcesPath
                pathToScript = resolvePackagedLibScriptPath(
                    process.resourcesPath,
                    process.platform,
                    'browser_install.mjs'
                )
                mainLog.debug(`Using production path: ${pathToScript}`)
            } else {
                // Fallback : utiliser le dossier lib du projet
                pathToScript = path.join(
                    process.cwd(),
                    'lib',
                    'browser_install.mjs'
                )
                mainLog.warn(
                    `process.resourcesPath not available, using fallback: ${pathToScript}`
                )
            }
            const child = utilityProcess.fork(pathToScript, ['test'], {
                stdio: ['ignore', 'pipe', 'pipe'],
            })
            let hasExited = false

            // Gérer les logs stdout
            if (child.stdout) {
                child.stdout.on('data', (data) => {
                    // Only all the last newlines (\n)
                    const all_last = /\n+$/
                    const _data = data.toString().replace(all_last, '')
                    mainLog.debug(_data)
                    _sendMessageToFrontLog(_data)
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
                            case 'complete': {
                                mainLog.info(`Complete: ${message.data}`)
                                toReturned.result = true
                                toReturned.message = `puppeteer and browsers are installed`
                                const mainWindow = getMainWindow()
                                if (mainWindow) {
                                    mainWindow.webContents.send(
                                        channels.HOST_INFORMATIONS_BACK,
                                        toReturned
                                    )
                                }
                                if (!hasExited) {
                                    hasExited = true
                                    resolve()
                                }
                                break
                            }
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
                mainLog.debug('Child process spawned successfully')
            })
        })
        return new Promise<ConfigData>((resolve) => {
            const mainWindow = getMainWindow()
            if (mainWindow) {
                mainWindow.webContents.send(
                    channels.HOST_INFORMATIONS_BACK,
                    toReturned
                )
            }
            resolve(toReturned)
        })
    } catch (error) {
        mainLog.error('Error on initPuppeteerBrowserInstallation 🚫', error)
        toReturned.error = `Error on initPuppeteerBrowserInstallation 🚫`
        toReturned.message = `Error on initPuppeteerBrowserInstallation 🚫`
        throw error
    }
}
