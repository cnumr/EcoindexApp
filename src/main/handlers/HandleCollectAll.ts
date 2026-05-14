import type {
    IAdvancedMesureData,
    IJsonMesureData,
    IKeyValue,
    ISimpleUrlInput,
} from '../../interface'
import {
    app,
    IpcMainEvent,
    IpcMainInvokeEvent,
    shell,
    utilityProcess,
} from 'electron'
import { getWorkDir, isDev } from '../memory'

import type { CliFlags } from 'lighthouse-plugin-ecoindex-courses'
import { _debugLogs } from '../utils/MultiDebugLogs'
import { _sendMessageToFrontConsole } from '../utils/SendMessageToFrontConsole'
import { _sendMessageToFrontLog } from '../utils/SendMessageToFrontLog'
import { convertJSONDatasFromISimpleUrlInput } from '../utils/ConvertJSONDatas'
import { fileURLToPath } from 'node:url'
import fs from 'fs'
import { getMainLog } from '../main'
import i18n from '../../configs/i18next.config'
import path from 'node:path'
import { showNotification } from '../utils/ShowNotification'
import { utils } from '../../shared/constants'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Vérifie que le répertoire de travail existe avant de lancer une collecte.
 * Cette fonction est appelée avant chaque mesure pour s'assurer que le dossier
 * de destination est valide et accessible.
 * @throws {Error} Si le répertoire de travail n'est pas défini ou vide
 */
async function _prepareCollect(): Promise<void> {
    const mainLog = getMainLog().scope('main/prepareCollect')
    try {
        const _workDir = getWorkDir() as string
        if (!_workDir || _workDir === '') {
            throw new Error('Work dir not found')
        }
    } catch (error) {
        mainLog.error('Error in _prepareCollect', error)
        throw error
    }
}

/**
 * Classe de base pour les données de collecte.
 * Représente les informations nécessaires pour lancer une mesure :
 * - Le type de collecte (simple ou complexe/parcours)
 * - Les commandes CLI à exécuter
 * - Les options d'audit
 */
class CollectDatas_V2 {
    collectType!: `simple` | `complexe`
    command!: CliFlags
    listAllAudits!: false
}

/**
 * Données pour une mesure simple : une ou plusieurs URLs analysées individuellement.
 * Chaque URL est traitée séparément et génère son propre rapport.
 */
class SimpleCollectDatas_V2 extends CollectDatas_V2 {
    declare collectType: 'simple'
}

/**
 * Données pour une mesure complexe (parcours) : analyse d'un parcours utilisateur
 * défini dans un fichier JSON avec plusieurs étapes/courses.
 * Les courses peuvent avoir des dépendances et des sélecteurs d'URL dynamiques.
 */
class ComplexeCollectDatas_V2 extends CollectDatas_V2 {
    declare collectType: 'complexe'
}

/**
 * Prépare les données de collecte selon le type de mesure.
 *
 * Pour une mesure simple :
 * - Prend une liste d'URLs en entrée
 * - Génère un répertoire de sortie avec timestamp
 * - Configure les catégories d'audit par défaut
 *
 * Pour une mesure complexe :
 * - Prend le chemin d'un fichier JSON de configuration
 * - Le fichier JSON contient les courses (parcours) à analyser
 * - Génère un répertoire de sortie avec timestamp
 *
 * @param collectType Type de collecte : 'simple' ou 'complexe'
 * @param output Formats de sortie souhaités : 'statement', 'json', 'html'
 * @param input Pour 'simple' : liste d'URLs, pour 'complexe' : chemin du fichier JSON
 * @returns Données de collecte préparées avec toutes les options configurées
 */
function _prepareDatas(
    collectType: `simple` | `complexe`,
    output: ('statement' | 'json' | 'html')[],
    input: string | ISimpleUrlInput[]
): ComplexeCollectDatas_V2 | SimpleCollectDatas_V2 {
    const _workDir = getWorkDir() as string
    if (!_workDir || _workDir === '') {
        throw new Error('Work dir not found')
    }
    const date = new Date().toISOString().split('.')[0].replace(/:/g, '-')
    const default_categories: (
        | 'lighthouse-plugin-ecoindex-core'
        | 'accessibility'
        | 'best-practices'
        | 'performance'
        | 'seo'
    )[] = [
        'best-practices',
        'performance',
        'seo',
        'lighthouse-plugin-ecoindex-core',
        'accessibility',
    ]

    if (collectType === 'simple') {
        const command: CliFlags = {
            generationDate: date,
            url: (input as ISimpleUrlInput[]).map((url) => {
                return url.value
            }),
            'output-path': '',
            exportPath: path.join(_workDir, date),
            output: output,
            'audit-category': default_categories,
            // 'puppeteer-script': null,
        }
        const ouput: SimpleCollectDatas_V2 = {
            collectType,
            command,
            listAllAudits: false,
        }
        return ouput
    } else {
        const command: CliFlags = {
            generationDate: new Date().toISOString(),
            'output-path': '',
            exportPath: path.join(_workDir, date),
            output: output,
            'json-file': input as string,
            'audit-category': default_categories,
            // 'puppeteer-script': null,
        }
        const collectDatas: ComplexeCollectDatas_V2 = {
            collectType,
            command,
            listAllAudits: false,
        }
        return collectDatas
    }
}

/**
 * Lance l'exécution effective de la collecte via un processus utilitaire Node.js.
 *
 * Flux d'exécution :
 * 1. Crée un répertoire de sortie avec timestamp
 * 2. Écrit les données de commande dans un fichier JSON temporaire
 * 3. Configure les variables d'environnement (WORK_DIR + variables utilisateur)
 * 4. Lance le script courses_index.mjs dans un processus séparé (utilityProcess)
 * 5. Écoute les logs stdout/stderr du processus enfant
 * 6. Gère les messages IPC du processus enfant (progress, error, complete)
 * 7. Nettoie le fichier temporaire à la fin
 * 8. Ouvre l'explorateur de fichiers pour les mesures simples
 *
 * Le script courses_index.mjs lit le fichier JSON temporaire et exécute les mesures
 * via Lighthouse avec le plugin ecoindex.
 *
 * @param command Données de collecte préparées (simple ou complexe)
 * @param _event Événement IPC (non utilisé mais requis par la signature)
 * @param isSimple Si true, ouvre l'explorateur de fichiers à la fin
 * @param envVars Variables d'environnement personnalisées à passer au processus
 * @returns Promise qui se résout quand la collecte est terminée
 */
async function _runDirectCollect(
    command: SimpleCollectDatas_V2 | ComplexeCollectDatas_V2,
    _event: IpcMainEvent | IpcMainInvokeEvent,
    isSimple = false,
    envVars: IKeyValue | null = null
) {
    const mainLog = getMainLog().scope('main/runDirectCollect')
    try {
        const workDir = command.command.exportPath
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
        fs.writeFileSync(tempFilePath, JSON.stringify(command.command))
        mainLog.log('Command data written to:', tempFilePath)

        // Vérifier que le fichier existe
        if (fs.existsSync(tempFilePath)) {
            mainLog.log('File exists, size:', fs.statSync(tempFilePath).size)
        } else {
            mainLog.error('File does not exist after writing!')
        }

        // Définir les variables d'environnement pour le processus Node.js
        process.env.WORK_DIR = workDir
        // Définir les variables d'environnement demandés par l'utilisateur
        if (envVars) {
            try {
                Object.entries(envVars).map((ev) => {
                    process.env[ev[0].toUpperCase()] = ev[1]
                })
            } catch {
                throw new Error(`EnvVars in error`)
            }
        }

        // Créer une Promise qui se résoudra quand le processus enfant sera terminé
        await new Promise<void>((resolve, reject) => {
            mainLog.debug('Starting utility process...')

            /**
             * Détermination du chemin du script courses_index.mjs selon l'environnement :
             *
             * - DÉVELOPPEMENT : Le script est dans src/lib/courses_index.mjs
             *   Accessible directement depuis le projet
             *
             * - PRODUCTION (packagé) :
             *   - Windows : lib.asar est extrait vers lib/ pendant l'initialisation
             *     → Utilise process.resourcesPath/lib/courses_index.mjs
             *   - macOS/Linux : On peut accéder directement à lib.asar
             *     → Utilise process.resourcesPath/lib.asar/courses_index.mjs
             *
             * Le script courses_index.mjs est le point d'entrée qui :
             * - Lit le fichier command-data.json
             * - Lance Lighthouse avec le plugin ecoindex
             * - Génère les rapports (HTML, JSON, statement)
             */
            let pathToScript: string
            if (!app.isPackaged || process.env['WEBPACK_SERVE'] === 'true') {
                // En développement : utiliser le dossier lib du projet
                pathToScript = path.join(
                    __dirname,
                    '..',
                    '..',
                    'lib',
                    'courses_index.mjs'
                )
                mainLog.debug(`Using development path: ${pathToScript}`)
            } else if (process.resourcesPath) {
                // En production packagée : utiliser process.resourcesPath
                pathToScript = path.join(
                    process.resourcesPath,
                    process.platform === 'win32' ? 'lib' : 'lib.asar',
                    'courses_index.mjs'
                )
                mainLog.debug(`Using production path: ${pathToScript}`)
            } else {
                // Fallback : utiliser le dossier lib du projet
                pathToScript = path.join(
                    __dirname,
                    '..',
                    '..',
                    'lib',
                    'courses_index.mjs'
                )
                mainLog.warn(
                    `process.resourcesPath not available, using fallback: ${pathToScript}`
                )
            }

            /**
             * Création d'un processus utilitaire séparé pour exécuter le script.
             * utilityProcess.fork permet d'exécuter un script Node.js dans un processus
             * isolé, ce qui évite de bloquer le processus principal de l'application.
             *
             * stdio configuré pour :
             * - stdin: 'ignore' (pas d'entrée standard)
             * - stdout: 'pipe' (capture des logs pour affichage dans la console)
             * - stderr: 'pipe' (capture des erreurs)
             */
            const child = utilityProcess.fork(pathToScript, ['test'], {
                stdio: ['ignore', 'pipe', 'pipe'],
            })

            /**
             * Flag pour éviter de résoudre/rejeter la Promise plusieurs fois
             * (peut arriver si on reçoit à la fois un message 'complete' et un exit code 0)
             */
            let hasExited = false

            /**
             * Écoute des logs stdout du processus enfant.
             * Ces logs sont affichés dans la console de l'application (frontend)
             * et dans les logs du main process.
             */
            // Gérer les logs stdout
            if (child.stdout) {
                child.stdout.on('data', (data) => {
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

            /**
             * Écoute des messages IPC du processus enfant.
             * Le script courses_index.mjs peut envoyer des messages structurés :
             * - { type: 'progress', data: string } : Progression de la mesure
             * - { type: 'error', data: string } : Erreur rencontrée
             * - { type: 'complete', data: string } : Mesure terminée avec succès
             *
             * Ces messages permettent une communication bidirectionnelle entre
             * le processus principal et le processus enfant.
             */
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

            /**
             * Gestion de la fin du processus enfant.
             *
             * Code de sortie :
             * - 0 : Succès, la collecte s'est terminée correctement
             * - Autre : Erreur, quelque chose s'est mal passé
             *
             * Actions effectuées :
             * 1. Suppression du fichier temporaire command-data.json
             * 2. Pour les mesures simples : ouverture de l'explorateur de fichiers
             *    sur le rapport HTML généré
             * 3. Résolution ou rejet de la Promise selon le code de sortie
             */
            // Gérer la fin du processus
            child.on('exit', (code: number) => {
                mainLog.log(`Child process exited with code ${code}`)
                if (code === 0) {
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
                } else {
                    const error = new Error(`Process exited with code ${code}`)
                    mainLog.error('Process failed:', error)
                    reject(error)
                }

                // gérer l'ouverture dans l'explorateur de fichiers is simple
                try {
                    if (isSimple) {
                        const url = path.join(workDir, `generic.report.html`)
                        mainLog.debug('url', url)
                        shell.showItemInFolder(url)
                    }
                } catch (error) {
                    mainLog.error('Error opening folder:', error)
                    _sendMessageToFrontLog(
                        'Error',
                        `Error opening folder: ${error}`
                    )
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

        return 'mesure done'
    } catch (error) {
        mainLog.error('Error in _runDirectCollect', error)
        throw error
    }
}

/**
 * Handler principal pour les mesures simples.
 *
 * Flux d'exécution :
 * 1. Validation : vérifie que la liste d'URLs n'est pas vide
 * 2. Notification : informe l'utilisateur du démarrage
 * 3. Préparation : crée les données de collecte avec les URLs et la config avancée
 * 4. Configuration : applique les options avancées (output, audit-category, extra-header, etc.)
 * 5. Exécution : lance _runDirectCollect qui exécute le script de mesure
 * 6. Notification : informe l'utilisateur du résultat (succès ou échec)
 *
 * Les rapports générés sont sauvegardés dans :
 * {workDir}/{timestamp}/ où timestamp est au format ISO (ex: 2025-12-27T10-30-45)
 *
 * @param event Événement IPC (non utilisé mais requis)
 * @param urlsList Liste des URLs à analyser
 * @param localAdvConfig Configuration avancée (formats de sortie, catégories d'audit, etc.)
 * @param envVars Variables d'environnement personnalisées
 * @returns 'collect done' si succès
 * @throws {Error} Si la liste d'URLs est vide ou si la collecte échoue
 */
export const handleSimpleCollect = async (
    event: IpcMainEvent | IpcMainInvokeEvent,
    urlsList: ISimpleUrlInput[],
    localAdvConfig: IAdvancedMesureData,
    envVars: IKeyValue
) => {
    const mainLog = getMainLog().scope('main/handleSimpleCollect')
    if (!urlsList || urlsList.length === 0) {
        throw new Error('Urls list is empty')
    }
    showNotification({
        subtitle: i18n.t('🧩 Simple collect'),
        body: i18n.t('Process intialization.'),
    })

    /**
     * Étape 1 : Préparation des données de base de collecte
     * Crée la structure de données avec les URLs et les formats de sortie de base
     */
    // prepare common collect
    const collectDatas = _prepareDatas(
        `simple`,
        localAdvConfig.output as ('statement' | 'json' | 'html')[],
        urlsList
    )

    /**
     * Étape 2 : Vérification du répertoire de travail
     * S'assure que le dossier de destination existe et est accessible
     */
    await _prepareCollect()
    _debugLogs('Simple measure start, process intialization...')
    _debugLogs(`Urls list: ${JSON.stringify(urlsList)}`)
    try {
        /**
         * Étape 3 : Application de la configuration avancée
         * Remplace les valeurs par défaut par celles choisies par l'utilisateur :
         * - Formats de sortie (HTML, JSON, statement)
         * - Catégories d'audit (performance, SEO, accessibility, etc.)
         * - Headers HTTP supplémentaires (cookies, authentification, etc.)
         * - User-Agent personnalisé
         * - Script Puppeteer personnalisé (pour interactions complexes)
         */
        collectDatas.command['output'] = localAdvConfig.output as (
            | 'statement'
            | 'json'
            | 'html'
        )[]
        collectDatas.command['audit-category'] = localAdvConfig[
            'audit-category'
        ] as (
            | 'accessibility'
            | 'best-practices'
            | 'performance'
            | 'seo'
            | 'lighthouse-plugin-ecoindex-core'
        )[]
        // Les extra-headers sont sérialisés en JSON pour être passés au script
        collectDatas.command['extra-header'] = JSON.stringify(
            localAdvConfig['extra-header']
        ) as unknown as {
            [key: string]: string
        }
        collectDatas.command['user-agent'] = localAdvConfig['user-agent']
        if (localAdvConfig['lang']) {
            collectDatas.command['lang'] = localAdvConfig['lang']
        }
        // Le script Puppeteer est optionnel, utilisé pour des interactions complexes
        if (localAdvConfig['puppeteer-script']) {
            collectDatas.command['puppeteer-script'] =
                localAdvConfig['puppeteer-script']
        }
        collectDatas.command['exportPath'] = path.join(
            (await getWorkDir()) as string,
            collectDatas.command.generationDate
        )
        showNotification({
            subtitle: i18n.t(' 🚀Simple collect'),
            body: i18n.t('Collect started...'),
        })
        try {
            if (isDev()) {
                mainLog.debug(
                    `before (simple) runCollect(collectDatas)`,
                    collectDatas
                )
            }
            await _runDirectCollect(collectDatas, event, true, envVars)
        } catch (error) {
            showNotification({
                subtitle: i18n.t('🚫 Simple collect'),
                body: i18n.t(`Collect KO, {{error}}\n`, { error }),
            })
            throw new Error('Simple collect error')
        }
        showNotification({
            subtitle: i18n.t('🎉 Simple collect'),
            body: i18n.t(
                `Collect done, you can consult reports in\n{{_workDir}}`,
                { _workDir: collectDatas.command.exportPath }
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
 * Handler principal pour les mesures complexes (parcours).
 *
 * Ce handler gère deux opérations :
 * 1. SAUVEGARDE : Écrit la configuration JSON dans le répertoire de travail
 * 2. COLLECTE (optionnelle) : Lance les mesures si andCollect = true
 *
 * Flux d'exécution :
 * 1. Validation : vérifie que les données JSON sont valides
 * 2. Sauvegarde : écrit le fichier JSON dans {workDir}/ecoindex.json
 * 3. Si andCollect = true :
 *    - Prépare les données de collecte avec le chemin du fichier JSON
 *    - Lance _runDirectCollect qui exécute le script de mesure
 *    - Ouvre le répertoire de travail à la fin
 *
 * Le fichier JSON contient :
 * - courses : Liste des parcours à analyser (chacun avec ses URLs et options)
 * - output : Formats de sortie souhaités
 * - audit-category : Catégories d'audit à exécuter
 * - extra-header : Headers HTTP supplémentaires
 * - puppeteer-script : Script Puppeteer optionnel pour interactions complexes
 *
 * @param event Événement IPC (non utilisé mais requis)
 * @param jsonDatas Configuration complète de la mesure complexe
 * @param andCollect Si true, lance la collecte après la sauvegarde
 * @param envVars Variables d'environnement personnalisées
 * @returns 'measure done' si succès et andCollect = true, sinon rien
 * @throws {Error} Si les données JSON sont invalides ou si la collecte échoue
 */
export const handleJsonSaveAndCollect = async (
    event: IpcMainEvent | IpcMainInvokeEvent,
    jsonDatas: IJsonMesureData,
    andCollect: boolean,
    envVars: IKeyValue
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
        /**
         * Écriture du fichier JSON de configuration.
         * Le fichier est sauvegardé dans le répertoire de travail avec le nom
         * défini dans utils.JSON_FILE_NAME (généralement 'ecoindex.json').
         *
         * Les données sont converties pour s'assurer que les URLs sont au bon format
         * (ISimpleUrlInput[] → string[]).
         */
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
            /**
             * Si andCollect = true, on lance la collecte après la sauvegarde.
             * Le script courses_index.mjs va lire le fichier JSON que nous venons
             * de créer et exécuter toutes les courses (parcours) définies dedans.
             */
            if (isDev()) mainLog.debug('Json measure start...')

            /**
             * Préparation des données de collecte pour une mesure complexe.
             * On passe le chemin du fichier JSON (pas les URLs directement)
             * car le script va lire le fichier pour récupérer toutes les courses.
             */
            // prepare common collect
            const collectDatas = _prepareDatas(
                `complexe`,
                jsonDatas.output as ('statement' | 'json' | 'html')[],
                jsonFilePath
            )
            if (jsonDatas['lang']) {
                collectDatas.command['lang'] = jsonDatas['lang']
            }
            _debugLogs('Json measure start...')
            _debugLogs(`JSON datas ${JSON.stringify(jsonDatas, null, 2)}`)
            try {
                await _runDirectCollect(collectDatas, event, false, envVars)
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
