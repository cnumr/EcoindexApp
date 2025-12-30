import { useCallback } from 'react'
import type { IJsonMesureData, IKeyValue } from '@/interface'
import { store as storeConstants } from '@/shared/constants'
import log from 'electron-log/renderer'

const frontLog = log.scope('front/App/useAppHandlers')

interface UseAppHandlersProps {
    workDir: string
    homeDir: string
    urlsList: any[]
    localAdvConfig: any
    envVars: IKeyValue
    jsonDatas: IJsonMesureData
    t: (key: string, options?: any) => string
    setWorkDir: (dir: string) => void
    setJsonDatas: (data: IJsonMesureData) => void
    setIsJsonFromDisk: (isFromDisk: boolean) => void
    setIsFirstStart: (isFirst: boolean) => void
    consoleMessages: string
    setConsoleMessagesSnapshot: (snapshot: string) => void
    showHidePopinDuringProcess: (
        value: string | boolean,
        setPopinText: (text: string) => void,
        setDisplayPopin: (display: boolean) => void
    ) => Promise<void>
    showNotification: (title: string, options: any) => void
    setPopinText: (text: string) => void
    setDisplayPopin: (display: boolean) => void
}

/**
 * Hook personnalisé qui centralise tous les handlers d'actions utilisateur.
 *
 * Ce hook encapsule la logique métier pour :
 * - Les mesures simples (analyse d'URLs individuelles)
 * - Les mesures complexes (parcours définis dans un JSON)
 * - La gestion du répertoire de travail
 * - L'initialisation de l'application
 *
 * Tous les handlers communiquent avec le processus principal via IPC
 * (Inter-Process Communication) pour exécuter les opérations système.
 *
 * @param props Propriétés nécessaires pour les handlers (états, setters, fonctions utilitaires)
 * @returns Objet contenant tous les handlers disponibles
 */
export function useAppHandlers({
    workDir,
    homeDir,
    urlsList,
    localAdvConfig,
    envVars,
    jsonDatas,
    t,
    setWorkDir,
    setJsonDatas,
    setIsJsonFromDisk,
    setIsFirstStart,
    consoleMessages,
    setConsoleMessagesSnapshot,
    showHidePopinDuringProcess,
    showNotification,
    setPopinText,
    setDisplayPopin,
}: UseAppHandlersProps) {
    /**
     * Lance une mesure simple : analyse une ou plusieurs URLs individuellement.
     *
     * Flux d'exécution :
     * 1. Vérification : demande confirmation si le répertoire de travail est le dossier par défaut
     * 2. Détection : vérifie si un fichier JSON de configuration existe dans le répertoire
     *    (pour suggérer une mesure complexe si approprié)
     * 3. Confirmation : affiche un dialogue si un fichier JSON est détecté
     * 4. Snapshot : capture l'état actuel des messages console (pour filtrer les logs de mesure)
     * 5. Popin : affiche une popin de chargement avec le message de démarrage
     * 6. Exécution : appelle handleSimpleMesures via IPC qui lance le script de mesure
     * 7. Notification : affiche une notification de succès ou d'échec
     *
     * Les rapports générés sont accessibles dans le répertoire de travail.
     *
     * @returns Promise<void>
     */
    const runSimpleMesures = async () => {
        frontLog.debug('Simple measures clicked')
        if (workDir === homeDir) {
            if (
                !confirm(
                    `${t(
                        'Are you shure to want create report(s) in your default folder?'
                    )}\n\rDestination: ${homeDir}`
                )
            )
                return
        }

        /**
         * Détection d'un fichier JSON de configuration existant.
         * Si un fichier ecoindex.json existe dans le répertoire de travail,
         * cela suggère qu'une mesure complexe (parcours) serait plus appropriée.
         * On demande confirmation à l'utilisateur avant de continuer avec une mesure simple.
         */
        // Vérifier si un fichier JSON de configuration existe
        const isJsonConfigFileExist =
            await window.electronAPI.handleIsJsonConfigFileExist(workDir)
        if (isJsonConfigFileExist) {
            /**
             * Dialogue de confirmation natif (via Electron dialog.showMessageBox).
             * L'utilisateur peut choisir d'annuler ou de continuer malgré tout.
             */
            // Afficher une boîte de dialogue de confirmation
            const shouldContinue = await window.electronAPI.showConfirmDialog({
                title: t('Do you really want to launch a simple measure?'),
                message: t(
                    'A complex measure configuration file has been detected in the selected folder, it seems that a complex measure is more appropriate.'
                ),
                buttons: [t('Cancel'), t('Continue')],
            })
            if (!shouldContinue) {
                frontLog.debug(
                    'User cancelled simple measure due to JSON config file'
                )
                return
            }
        }

        // Capturer l'état actuel des messages console pour filtrer ensuite
        setConsoleMessagesSnapshot(consoleMessages)
        await showHidePopinDuringProcess(
            `${t('Url(s) Measure (Simple mode)')} started 🚀`,
            setPopinText,
            setDisplayPopin
        )
        try {
            await window.electronAPI.handleSimpleMesures(
                urlsList,
                localAdvConfig,
                envVars
            )
            await showHidePopinDuringProcess(
                true,
                setPopinText,
                setDisplayPopin
            )
        } catch (error) {
            frontLog.error('Error on runSimpleMesures', error)
            showNotification('', {
                body: t('Error on runSimpleMesures'),
                subtitle: t('Courses Measure (Simple mode)'),
            })
            await showHidePopinDuringProcess(
                false,
                setPopinText,
                setDisplayPopin
            )
        }
    }

    /**
     * Lit et recharge la configuration JSON pour les mesures de parcours.
     *
     * Cette fonction est appelée automatiquement quand le répertoire de travail change
     * (via useWorkDirEffect). Elle permet de charger automatiquement un fichier
     * ecoindex.json existant dans le nouveau répertoire.
     *
     * Flux :
     * 1. Appel IPC pour lire le fichier JSON dans le répertoire de travail
     * 2. Si le fichier existe et est valide : met à jour l'état jsonDatas
     * 3. Met à jour le flag isJsonFromDisk pour indiquer que les données viennent du disque
     *
     * Utilise useCallback pour éviter les re-créations inutiles de la fonction.
     *
     * @returns Promise<void>
     */
    const runJsonReadAndReload = useCallback(async () => {
        frontLog.log('Json read and reload')
        try {
            const _jsonDatas: IJsonMesureData =
                await window.electronAPI.handleJsonReadAndReload()
            frontLog.debug(`runJsonReadAndReload`, _jsonDatas)
            if (_jsonDatas) {
                setJsonDatas(_jsonDatas)
                setIsJsonFromDisk(true)
            } else {
                setIsJsonFromDisk(false)
            }
        } catch (error) {
            frontLog.error('Error on runJsonReadAndReload', error)
            showNotification('', {
                subtitle: '🚫 Courses Measure (Full mode)',
                body: 'Error on runJsonReadAndReload',
            })
        }
    }, [setJsonDatas, setIsJsonFromDisk, showNotification])

    /**
     * Lance les mesures de parcours (complexes).
     *
     * Cette fonction effectue deux opérations :
     * 1. SAUVEGARDE : Écrit la configuration JSON actuelle dans le répertoire de travail
     *    (fichier ecoindex.json)
     * 2. COLLECTE : Si saveAndCollect = true, lance les mesures après la sauvegarde
     *
     * Flux d'exécution :
     * 1. Vérification : demande confirmation si le répertoire est le dossier par défaut
     * 2. Snapshot : capture l'état actuel des messages console
     * 3. Popin : affiche une popin de chargement
     * 4. Exécution : appelle handleJsonSaveAndCollect via IPC
     *    - Sauvegarde le fichier JSON
     *    - Si saveAndCollect = true, lance le script de mesure
     * 5. Notification : affiche une notification de succès ou d'échec
     *
     * Le fichier JSON sauvegardé contient toutes les courses (parcours) configurées
     * par l'utilisateur dans l'interface.
     *
     * @param saveAndCollect Si true, lance la collecte après la sauvegarde
     * @param envVars Variables d'environnement personnalisées à passer au script
     * @returns Promise<void>
     */
    const runJsonSaveAndCollect = async (
        saveAndCollect = false,
        envVars: IKeyValue = {}
    ) => {
        frontLog.debug('Json save clicked')
        if (workDir === homeDir) {
            if (
                !confirm(
                    t(
                        `Are you shure to want create report(s) in your default folder?\n\rDestination: {{homeDir}}`,
                        { homeDir }
                    )
                )
            )
                return
        }
        /**
         * Capture de l'état actuel des messages console.
         * Cette snapshot permet de filtrer les messages dans la popin de chargement
         * pour n'afficher que les logs générés pendant cette mesure spécifique.
         */
        // Capturer l'état actuel des messages console pour filtrer ensuite
        setConsoleMessagesSnapshot(consoleMessages)
        await showHidePopinDuringProcess(
            `${t('Courses Measure (Full mode)')} started 🚀`,
            setPopinText,
            setDisplayPopin
        )
        try {
            frontLog.debug(`jsonDatas`, jsonDatas)
            frontLog.debug(`saveAndCollect`, saveAndCollect)
            await window.electronAPI.handleJsonSaveAndCollect(
                jsonDatas,
                saveAndCollect,
                envVars
            )
            await showHidePopinDuringProcess(
                true,
                setPopinText,
                setDisplayPopin
            )
        } catch (error) {
            frontLog.error('Error on runJsonSaveAndCollect', error)
            showNotification('', {
                subtitle: t('🚫 Courses Measure (Full mode)'),
                body: t('Error on runJsonSaveAndCollect'),
            })
            await showHidePopinDuringProcess(
                false,
                setPopinText,
                setDisplayPopin
            )
        }
    }

    /**
     * Handlers, notify user.
     * @param title string
     * @param message string
     */
    const handlerJsonNotify = (title: string, message: string) => {
        frontLog.debug('Json notify clicked')
        showNotification('', { body: message, subtitle: title })
    }

    /**
     * Handler for selecting workDir.
     */
    const selectWorkingFolder = async () => {
        const filePath = await window.electronAPI.handleSelectFolder()

        if (filePath !== undefined) {
            setWorkDir(filePath)
        }
    }

    /**
     * Launch Initialization.
     * @param forceInitialisation
     */
    const launchInitialization = async (forceInitialisation: boolean) => {
        frontLog.debug(`initializeApplication start 🚀`)
        if (
            forceInitialisation ||
            (await window.store.get(storeConstants.APP_INSTALLED_ONCE, false))
        )
            setIsFirstStart(false)
        const result =
            await window.initialisationAPI.initializeApplication(
                forceInitialisation
            )
        frontLog.debug(
            `initializeApplication ended with ${result ? 'OK 👍' : 'KO 🚫'} status.`
        )
    }

    return {
        runSimpleMesures,
        runJsonReadAndReload,
        runJsonSaveAndCollect,
        handlerJsonNotify,
        selectWorkingFolder,
        launchInitialization,
    }
}
