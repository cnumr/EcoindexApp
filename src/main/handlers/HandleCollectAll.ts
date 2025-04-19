import { ChildProcess, spawn } from 'child_process'
import { IpcMainEvent, shell, utilityProcess } from 'electron'
import { getNodeDir, getNpmDir, getWorkDir, isDev } from '../memory'

import { Readable } from 'stream'
import { _debugLogs } from '../utils/MultiDebugLogs'
import { _echoReadable } from '../utils/EchoReadable'
import { _sendMessageToFrontLog } from '../utils/SendMessageToFrontLog'
import { convertJSONDatasFromISimpleUrlInput } from '../utils/ConvertJSONDatas'
import { error } from 'console'
import { fileURLToPath } from 'node:url'
import fs from 'fs'
import { getMainLog } from '../main'
import i18n from '../../configs/i18next.config'
import os from 'node:os'
import path from 'node:path'
import { showNotification } from '../utils/ShowNotification'
import { utils } from '../../shared/constants'

/**
 * Utils, prepare Json Collect.
 * @returns Promise<{
  command: string[]
  nodeDir: string
  workDir: string
}>
 */
async function _prepareCollect(): Promise<{
    command: string[]
    nodeDir: string
    workDir: string
}> {
    const mainLog = getMainLog().scope('main/prepareCollect')
    // create stream to log the output. TODO: use specified path
    try {
        const _workDir = getWorkDir() as string
        if (!_workDir || _workDir === '') {
            throw new Error('Work dir not found')
        }

        let nodeDir = getNodeDir()
        _debugLogs(`Node dir: ${nodeDir}`)

        const npmDir = getNpmDir()
        _debugLogs(`Npm dir: ${npmDir}`)

        const command = [
            path.join(
                __dirname,
                `../..`,
                `node_modules`,
                `lighthouse-plugin-ecoindex`,
                `cli`,
                `run.js`
            ),
            'collect',
        ]
        if (os.platform() === `win32`) {
            nodeDir = nodeDir.replace(/\\/gm, path.sep)
        }
        return { command, nodeDir, workDir: _workDir.replace(/ /g, '\\ ') }
    } catch (error) {
        mainLog.error('Error in _prepareCollect', error)
    }
}

class CollectDatas {
    collectType: `simple` | `complexe`
    outputPath: string
    output?: string[]
    listAllAudits: false
    generationDate: string
}

class SimpleCollectDatas extends CollectDatas {
    declare collectType: 'simple'
    url: string[]
}
class ComplexeCollectDatas extends CollectDatas {
    declare collectType: 'complexe'
    jsonFile: string
}

function _prepareDatas(
    collectType: `simple` | `complexe`,
    output: string[],
    input: string | ISimpleUrlInput[]
): ComplexeCollectDatas | SimpleCollectDatas {
    const _workDir = getWorkDir() as string
    if (!_workDir || _workDir === '') {
        throw new Error('Work dir not found')
    }
    if (collectType === 'simple') {
        const collectDatas: SimpleCollectDatas = {
            collectType,
            outputPath: _workDir,
            output,
            url: (input as ISimpleUrlInput[]).map((url) => {
                return url.value
            }),
            listAllAudits: false,
            generationDate: new Date().toISOString(),
        }
        return collectDatas
    } else {
        const collectDatas: ComplexeCollectDatas = {
            collectType,
            outputPath: _workDir,
            output,
            jsonFile: input as string,
            listAllAudits: false,
            generationDate: new Date().toISOString(),
        }
        return collectDatas
    }
}

/**
 * Utils, Collect
 * @param command string[]
 * @param nodeDir string
 * @param event IpcMainEvent
 * @param logStream
 * @returns string
 */
async function _runCollect(
    command: string[],
    nodeDir: string,
    event: IpcMainEvent,
    isSimple = false
): Promise<string> {
    const mainLog = getMainLog().scope('main/runCollect')
    try {
        const out: string[] = []

        const [script, ...args] = command
        _debugLogs(`runCollect: ${script} ${JSON.stringify(args, null, 2)}`)
        _debugLogs(
            `runCollect: ${process.execPath} ${JSON.stringify(command, null, 2)}`
        )
        // const controller = new AbortController()
        // const { signal } = controller
        // const childProcess: ChildProcess = fork(script, args, {
        //     stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        //     // stdio: [0, 1, 2, 'ipc'],
        //     // silent: true,
        //     // signal,
        // })
        // childProcess.send('hello')
        const childProcess: ChildProcess = spawn(nodeDir, command, {
            stdio: ['pipe', 'pipe', process.stderr],
            shell: true,
            windowsHide: true,
            // signal,
            // signal,
        })
        childProcess.on('message', (mess) => {
            _debugLogs(`Message detected`, mess)
        })
        childProcess.on('error', (err) => {
            _debugLogs(`Error detected`, err)
            // This will be called with err being an AbortError if the controller aborts
        })

        childProcess.on('exit', (code, signal) => {
            if (isSimple && out.length > 0) {
                const fl = (item: string) => {
                    return item.includes('Report generated')
                }
                const filtered = out.filter(fl)
                const url =
                    'file:///' +
                    filtered
                        .at(-1)
                        .replace(`Report generated: `, ``)
                        .split('generic.report.html')[0] +
                    `generic.report.html`
                mainLog.debug(`url`, url)
                shell.openExternal(url, { activate: true })
            }
            _debugLogs(
                `Child process exited with code ${code} and signal ${signal}`
            )
        })

        childProcess.on('close', (code) => {
            _debugLogs(`Child process close with code ${code}`)
            _debugLogs('Measure done 🚀')
        })

        childProcess.stdout.on('data', (data) => {
            out.push(data.toString())
            _debugLogs(`stdout: ${data}`)
        })

        if (childProcess.stderr) {
            childProcess.stderr.on('data', (data) => {
                _debugLogs(`stderr: ${data.toString()}`)
            })
        }

        childProcess.on('disconnect', () => {
            _debugLogs('Child process disconnected')
        })

        childProcess.on('message', (message, sendHandle) => {
            _debugLogs(`Child process message: ${message}`)
        })

        await _echoReadable(event, childProcess.stdout)
        // controller.abort()
        return 'mesure done'
    } catch (error) {
        mainLog.error('Error in _runCollect', error)
    }
}

async function _runDirectCollect(
    command: SimpleCollectDatas | ComplexeCollectDatas,
    event: IpcMainEvent,
    isSimple = false
) {
    const mainLog = getMainLog().scope('main/runDirectCollect')
    try {
        const workDir = path
            .join(command.outputPath, command.generationDate)
            .split('.')[0]
            .replace(/:/g, '-')
        mainLog.log('Work directory:', workDir)

        const tempFilePath = path.join(workDir, 'command-data.json')
        mainLog.log('Temporary file path:', tempFilePath)

        // S'assurer que le répertoire existe
        if (!fs.existsSync(workDir)) {
            mainLog.log('Creating directory:', workDir)
            fs.mkdirSync(workDir, { recursive: true })
        }

        // Écrire les données dans le fichier
        mainLog.log('Writing command data to file')
        const cliFlags = {
            url: ['https://www.ecoindex.fr/', 'https://novagaia.fr/'],
            output: ['json', 'html'],
            exportPath: workDir,
            generationDate: command.generationDate,
        }
        fs.writeFileSync(tempFilePath, JSON.stringify(cliFlags))
        mainLog.log('Command data written to:', tempFilePath)

        // Vérifier que le fichier existe
        if (fs.existsSync(tempFilePath)) {
            mainLog.log('File exists, size:', fs.statSync(tempFilePath).size)
        } else {
            mainLog.error('File does not exist after writing!')
        }

        // Définir les variables d'environnement pour le processus Node.js
        process.env.WORK_DIR = workDir

        // Créer une Promise qui se résoudra quand le processus enfant sera terminé
        await new Promise<void>((resolve, reject) => {
            mainLog.debug('Starting utility process...')
            const child = utilityProcess.fork(
                path.join(
                    __dirname,
                    '..',
                    '..',
                    'src',
                    'extraResources',
                    'courses',
                    'index.mjs'
                )
            )

            let hasExited = false

            // Gérer les logs stdout
            if (child.stdout) {
                child.stdout.on('data', (data) => {
                    mainLog.debug(`stdout: ${data.toString()}`)
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

                // Supprimer le fichier temporaire
                try {
                    if (fs.existsSync(tempFilePath)) {
                        fs.unlinkSync(tempFilePath)
                        mainLog.debug('Temporary file deleted')
                    } else {
                        mainLog.warn(
                            'Temporary file does not exist, nothing to delete'
                        )
                    }
                } catch (error) {
                    mainLog.error('Error deleting temporary file:', error)
                }

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
                        reject(error)
                    }
                }
            })

            // Gérer le démarrage du processus
            child.on('spawn', () => {
                mainLog.log('Child process spawned successfully')
            })
        })
        // try {
        //     // gérer l'ouverture dans le navigateur is simple
        //     if (isSimple) {
        //         const url = path.join(
        //             workDir,
        //             `generic.report.html`
        //         )
        //         console.log('url', url)
        //         shell.openExternal(url, {
        //             activate: true,
        //         })
        //     }
        // } catch (error) {
        //     console.error(
        //         'Error opening browser:',
        //         error
        //     )
        //     _sendMessageToFrontLog(
        //         'Error',
        //         `Error opening browser: ${error}`
        //     )
        //     mainLog.log(
        //         `Error opening browser: ${error}`
        //     )
        // }
        return 'mesure done'
    } catch (error) {
        mainLog.error('Error in _runDirectCollect', error)
        throw error
    }
}

/**
 * Handlers, SimpleCollect
 * @param event IpcMainEvent
 * @param urlsList ISimpleUrlInput[]
 * @returns string
 */
export const handleSimpleCollect = async (
    event: IpcMainEvent,
    urlsList: ISimpleUrlInput[]
) => {
    const mainLog = getMainLog().scope('main/handleSimpleCollect')
    if (!urlsList || urlsList.length === 0) {
        throw new Error('Urls list is empty')
    }
    showNotification({
        subtitle: i18n.t('🧩 Simple collect'),
        body: i18n.t('Process intialization.'),
    })

    // prepare common collect
    const collectDatas = _prepareDatas(`simple`, [`html`], urlsList)
    const { command, nodeDir, workDir: _workDir } = await _prepareCollect()

    _debugLogs('Simple measure start, process intialization...')
    _debugLogs(`Urls list: ${JSON.stringify(urlsList)}`)
    try {
        urlsList.forEach((url) => {
            if (url.value) {
                command.push('-u')
                command.push(url.value)
            }
        })
        command.push('-o')
        command.push('html')
        command.push('--output-path')
        command.push(`${_workDir}`)
        // Fake mesure and path. TODO: use specified path and urls
        showNotification({
            subtitle: i18n.t(' 🚀Simple collect'),
            body: i18n.t('Collect started...'),
        })
        try {
            if (isDev()) {
                // mainLog.debug(`before (simple) runCollect`, nodeDir, command)
                const [script, ...args] = command
                mainLog.debug(`before (simple) runCollect`, script, args)
                // mainLog.debug(`before (simple) runCollect`, collectDatas)
            }
            // await _runCollect(command, nodeDir, event, true)
            await _runDirectCollect(collectDatas, event, true)
        } catch (error) {
            showNotification({
                subtitle: i18n.t('🚫 Simple collect'),
                body: i18n.t(`Collect KO, {{error}}\n`, { error }),
            })
            throw new Error('Simple collect error')
        }
        // process.stdout.write(data)
        // const _workDir = collectDatas.outputPath
        showNotification({
            subtitle: i18n.t('🎉 Simple collect'),
            body: i18n.t(
                `Collect done, you can consult reports in\n{{_workDir}}`,
                { _workDir }
            ),
        })
        if (isDev()) mainLog.debug('Simple collect done 🚀')
        return 'collect done'
    } catch (error) {
        _debugLogs(`stderr: ${error}`)
    }
    // alert process done
}

/**
 * Handler, JsonSaveAndCollect
 * @param event IpcMainEvent
 * @param jsonDatas IJsonMesureData
 * @param andCollect boolean
 * @returns string
 */
export const handleJsonSaveAndCollect = async (
    event: IpcMainEvent,
    jsonDatas: IJsonMesureData,
    andCollect: boolean
) => {
    const mainLog = getMainLog().scope('main/handleJsonSaveAndCollect')
    if (!jsonDatas) {
        throw new Error('Json data is empty')
    }
    showNotification({
        subtitle: andCollect
            ? i18n.t('🧩 JSON save and collect')
            : i18n.t('🧩 JSON save'),
        body: i18n.t('Process intialization.'),
    })
    _debugLogs('Json save or/and collect start...')

    try {
        const _workDir = await getWorkDir()
        if (!_workDir || _workDir === '') {
            throw new Error('Work dir not found')
        }
        // _workDir = (_workDir as string).replace(/ /g, '\\\\ ')
        if (isDev()) mainLog.debug(`Work dir: ${_workDir}`)
        const jsonFilePath = path.join(_workDir as string, utils.JSON_FILE_NAME)
        const jsonStream = fs.createWriteStream(jsonFilePath)
        showNotification({
            subtitle: andCollect
                ? i18n.t('🚀 JSON save and collect')
                : i18n.t('🚀 JSON save'),
            body: andCollect
                ? i18n.t('Json save and collect started...')
                : i18n.t('Json save started...'),
        })
        try {
            if (jsonDatas && typeof jsonDatas === 'object') {
                jsonStream.write(
                    JSON.stringify(
                        convertJSONDatasFromISimpleUrlInput(jsonDatas),
                        null,
                        2
                    )
                )
            } else {
                mainLog.error('jsonDatas have a problem!')
                throw new Error('jsonDatas have a problem!')
            }
        } catch (error) {
            showNotification({
                subtitle: andCollect
                    ? i18n.t('🚫 JSON save and collect')
                    : i18n.t('🚫 JSON save'),
                body: i18n.t('Json file not saved.'),
            })
            _debugLogs(`Error writing JSON file. ${error}`)
            throw new Error(`Error writing JSON file. ${error}`)
        }
        if (!andCollect) {
            showNotification({
                subtitle: i18n.t('💾 JSON save'),
                body: i18n.t('Json file saved.'),
            })
        } else {
            if (isDev()) mainLog.debug('Json measure start...')

            // prepare common collect
            const collectDatas = _prepareDatas(`complexe`, null, jsonFilePath)
            // const {
            //     command,
            //     nodeDir,
            //     workDir: _workDir,
            // } = await _prepareCollect()
            _debugLogs('Json measure start...')
            _debugLogs(`JSON datas ${JSON.stringify(jsonDatas, null, 2)}`)
            // command.push('--json-file')
            // command.push(path.join(_workDir, utils.JSON_FILE_NAME))
            // command.push('--output-path')
            // command.push(_workDir)
            try {
                // await _runCollect(command, nodeDir, event)
                await _runDirectCollect(collectDatas, event, false)
            } catch (error) {
                mainLog.error('Simple collect error', error)
                throw new Error('Simple collect error')
            }
            showNotification({
                subtitle: i18n.t('🎉 JSON collect'),
                body: i18n.t(
                    `Measures done, you can consult reports in\n{{_workDir}}`,
                    { _workDir }
                ),
            })
            try {
                shell.openPath((await getWorkDir()) as string)
            } catch (error) {
                mainLog.error(error)
            }
            _debugLogs('Json collect done 🚀')
            return 'measure done'
        }
    } catch (error) {
        if (!andCollect) {
            _sendMessageToFrontLog('ERROR, Json file not saved', error)
            _debugLogs('ERROR, Json file not saved', error)
            showNotification({
                subtitle: i18n.t('🚫 JSON save'),
                body: i18n.t('Json file not saved.'),
            })
        } else {
            _sendMessageToFrontLog(
                'ERROR, Json file not saved or collect',
                error
            )
            _debugLogs('ERROR, Json file not saved or collect', error)
            showNotification({
                subtitle: i18n.t('🚫 JSON save and collect'),
                body: i18n.t('Json file not saved or collect.'),
            })
        }
    }
}
