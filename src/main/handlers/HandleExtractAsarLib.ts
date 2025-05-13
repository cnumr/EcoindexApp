import { _sendMessageToFrontConsole } from '../utils/SendMessageToFrontConsole'
import { _sendMessageToFrontLog } from '../utils/SendMessageToFrontLog'
import asar from '@electron/asar'
import fs from 'fs'
import { getMainLog } from '../main'
import path from 'path'
import { utilityProcess } from 'electron'

const extractAsarLib = async () => {
    const mainLog = getMainLog().scope('main/extract-asar-lib')
    const libPath = path.join(process.resourcesPath, 'lib')
    if (fs.existsSync(libPath)) {
        mainLog.info(`Extract ASAR file skipped (lib folder already exists)`)
        return
    }
    if (process.env['WEBPACK_SERVE'] !== 'true') {
        await new Promise<void>((resolve, reject) => {
            mainLog.info(`Extract ASAR file`)
            try {
                asar.extractAll(
                    path.join(process.resourcesPath, 'lib.asar'),
                    libPath
                )
                mainLog.info(`Extract ASAR file completed`)
                resolve()
            } catch (error) {
                mainLog.error(`Error extracting ASAR file`, error)
                reject(error)
            }
        })
        // try {
        //     await new Promise<void>((resolve, reject) => {
        //         const child = utilityProcess.fork(
        //             path.join(
        //                 process.resourcesPath,
        //                 'lib.asar',
        //                 'asar_index.mjs'
        //             ),
        //             ['test'],
        //             {
        //                 stdio: ['ignore', 'pipe', 'pipe'],
        //             }
        //         )
        //         let hasExited = false

        //         // Gérer les logs stdout
        //         if (child.stdout) {
        //             child.stdout.on('data', (data) => {
        //                 const all = /\n/g
        //                 const first = /^\n/
        //                 // Only remove the last newline characters (\n)
        //                 const last = /\n$/
        //                 // Only all the last newlines (\n)
        //                 const all_last = /\n+$/
        //                 const _data = data.toString().replace(all_last, '')
        //                 mainLog.debug(_data)
        //                 _sendMessageToFrontLog(_data)
        //                 _sendMessageToFrontConsole(_data)
        //             })
        //         }

        //         // Gérer les logs stderr
        //         if (child.stderr) {
        //             child.stderr.on('data', (data) => {
        //                 mainLog.error(`stderr: ${data.toString()}`)
        //             })
        //         }

        //         // Gérer les messages du processus enfant
        //         child.on('message', (message) => {
        //             mainLog.info('Message from child:', message)
        //             if (typeof message === 'object' && message !== null) {
        //                 if ('type' in message) {
        //                     switch (message.type) {
        //                         case 'progress':
        //                             mainLog.debug(`Progress: ${message.data}`)
        //                             break
        //                         case 'error':
        //                             mainLog.error(
        //                                 `Error from child: ${message.data}`
        //                             )
        //                             if (!hasExited) {
        //                                 hasExited = true
        //                                 reject(
        //                                     new Error(
        //                                         `Process error: ${message.data}`
        //                                     )
        //                                 )
        //                             }
        //                             break
        //                         case 'complete':
        //                             mainLog.info(`Complete: ${message.data}`)
        //                             if (!hasExited) {
        //                                 hasExited = true
        //                                 resolve()
        //                             }
        //                             break
        //                         default:
        //                             mainLog.warn(
        //                                 `Unknown message type: ${message}`
        //                             )
        //                     }
        //                 }
        //             }
        //         })

        //         // Gérer la fin du processus
        //         child.on('exit', (code: number) => {
        //             mainLog.log(`Child process exited with code ${code}`)
        //             if (!hasExited) {
        //                 hasExited = true
        //                 if (code === 0) {
        //                     mainLog.log('Process completed successfully')
        //                     resolve()
        //                 } else {
        //                     const error = new Error(
        //                         `Process exited with code ${code}`
        //                     )
        //                     mainLog.error('Process failed:', error)
        //                     reject(error)
        //                 }
        //             }
        //         })
        //     })
        // } catch (error) {
        //     mainLog.error(`Error extracting ASAR file`, error)
        // }
    } else {
        mainLog.info(`Extract ASAR file skipped (WEBPACK_SERVE is true)`)
    }
}

export default extractAsarLib
