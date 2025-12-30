import { _sendMessageToFrontConsole } from '../../utils/SendMessageToFrontConsole'
import { _sendMessageToFrontLog } from '../../utils/SendMessageToFrontLog'
import asar from '@electron/asar'
import fs from 'fs'
import { getMainLog } from '../../main'
import path from 'path'

const extractAsarLib = async () => {
    const mainLog = getMainLog().scope('main/extract-asar-lib')
    mainLog.info(`Extract ASAR file for Windows (hack)`)

    // En développement, process.resourcesPath n'existe pas, on skip
    if (!process.resourcesPath) {
        mainLog.info(
            `Extract ASAR file skipped (development mode, process.resourcesPath not available)`
        )
        return
    }

    // Extraire lib.asar uniquement sur Windows
    if (process.platform !== 'win32') {
        mainLog.info(
            `Extract ASAR file skipped (not Windows, using lib.asar directly)`
        )
        return
    }

    const libPath = path.join(process.resourcesPath, 'lib')
    if (fs.existsSync(path.join(libPath, 'package.json'))) {
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
                _sendMessageToFrontLog(`Extract ASAR file completed`)
                _sendMessageToFrontConsole(`Extract ASAR file completed`)
                resolve()
            } catch (error) {
                mainLog.error(`Error extracting ASAR file`, error)
                _sendMessageToFrontLog(`Error extracting ASAR file`, error)
                _sendMessageToFrontConsole(`Error extracting ASAR file`, error)
                reject(error)
            }
        })
    } else {
        mainLog.info(`Extract ASAR file skipped (WEBPACK_SERVE is true)`)
    }
}

export default extractAsarLib
