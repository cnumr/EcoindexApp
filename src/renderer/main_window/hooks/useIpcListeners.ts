import React, { useEffect, useRef } from 'react'
import { LinuxUpdate } from '@/class/LinuxUpdate'
import { ConfigData } from '@/class/ConfigData'
import { InitalizationMessage } from '@/types'
import { InitalizationData } from '@/class/InitalizationData'
import i18nResources from '@/configs/i18nResources'
import log from 'electron-log/renderer'
import { channels } from '@/shared/constants'

const frontLog = log.scope('front/App/useIpcListeners')

interface UseIpcListenersProps {
    tRef: React.MutableRefObject<(key: string, options?: any) => string>
    setDatasFromHost: React.Dispatch<React.SetStateAction<any>>
    setConsoleMessages: React.Dispatch<React.SetStateAction<string>>
    setWorkDir: (dir: string) => void
    setHomeDir: (dir: string) => void
    setAppReady: (ready: boolean) => void
    setIsPuppeteerBrowserInstalled: (installed: boolean) => void
    setPuppeteerBrowserInstalledVersion: (version: string) => void
    setInformationPopinTitle: (title: string) => void
    setInformationPopinMessage: (message: string) => void
    setInformationPopinErrorLink: (link: { label: string; url: string }) => void
    setDisplayInformationPopin: (display: boolean) => void
    setShowInformationSpinner: (show: boolean) => void
    setInformationPopinIsAlert: (isAlert: boolean) => void
    sleep: (ms: number, clear?: boolean) => Promise<void>
}

/**
 * Hook personnalisé qui gère tous les écouteurs IPC (Inter-Process Communication).
 *
 * Ce hook configure la communication bidirectionnelle entre le processus renderer
 * (interface utilisateur) et le processus main (logique métier).
 *
 * Écouteurs configurés :
 * 1. handleNewLinuxVersion : Vérification des mises à jour pour Linux
 * 2. sendDatasToFront : Réception des données du processus main (config, résultats, etc.)
 * 3. asynchronous-log : Réception des logs du processus main pour affichage dans la console
 * 4. changeLanguageInFront : Changement de langue depuis le menu de l'application
 * 5. sendInitializationMessages : Messages d'initialisation (progression, erreurs, etc.)
 *
 * Mécanisme de déduplication :
 * - Les messages console sont dédupliqués pour éviter les affichages multiples
 * - Un message identique reçu dans les 100ms est ignoré
 *
 * Nettoyage :
 * - Tous les écouteurs sont correctement nettoyés au démontage du composant
 * - Utilise des refs pour stocker les fonctions de cleanup
 *
 * @param props Propriétés nécessaires (setters d'état, fonctions utilitaires)
 */
export function useIpcListeners({
    tRef,
    setDatasFromHost,
    setConsoleMessages,
    setWorkDir,
    setHomeDir,
    setAppReady,
    setIsPuppeteerBrowserInstalled,
    setPuppeteerBrowserInstalledVersion,
    setInformationPopinTitle,
    setInformationPopinMessage,
    setInformationPopinErrorLink,
    setDisplayInformationPopin,
    setShowInformationSpinner,
    setInformationPopinIsAlert,
    sleep,
}: UseIpcListenersProps) {
    /**
     * Refs pour gérer les écouteurs IPC et éviter les fuites mémoire.
     *
     * handleConsoleMessageRef : Stocke la fonction de callback pour les logs console
     * isListenerAddedRef : Flag pour éviter d'ajouter plusieurs fois le même écouteur
     * lastMessageRef : Trace du dernier message reçu pour déduplication
     * cleanup*Ref : Fonctions de nettoyage pour chaque type d'écouteur
     */
    const handleConsoleMessageRef = useRef<
        | ((_event: any, message: string, ...optionalParams: any[]) => void)
        | null
    >(null)
    const isListenerAddedRef = useRef<boolean>(false)
    /**
     * Garde une trace du dernier message reçu pour éviter les doublons.
     * Un message identique reçu dans les 100ms est ignoré.
     */
    const lastMessageRef = useRef<{
        message: string
        timestamp: number
    } | null>(null)
    const cleanupLinuxVersionRef = useRef<(() => void) | null>(null)
    const cleanupSendDatasRef = useRef<(() => void) | null>(null)
    const cleanupChangeLanguageRef = useRef<(() => void) | null>(null)
    const cleanupInitializationRef = useRef<(() => void) | null>(null)

    useEffect(() => {
        if (!window.electronAPI) {
            frontLog.error('window.electronAPI is not available!')
            return
        }

        // Handler Linux Update
        if (cleanupLinuxVersionRef.current) {
            cleanupLinuxVersionRef.current()
        }
        cleanupLinuxVersionRef.current =
            window.electronAPI.handleNewLinuxVersion(
                (linuxUpdate: LinuxUpdate) => {
                    frontLog.debug(`linuxUpdate`, linuxUpdate)
                    const resp = window.confirm(
                        tRef.current(
                            `A new version of the app is avalaible ({{version}}), do you want to download it?`,
                            { version: linuxUpdate.latestReleaseVersion }
                        )
                    )
                    if (resp === true) {
                        window.open(
                            linuxUpdate.latestReleaseURL,
                            `_blank`,
                            'noopener,noreferrer'
                        )
                    }
                }
            )

        /**
         * Écouteur pour les données envoyées depuis le processus main.
         *
         * Le processus main peut envoyer des données de différents types :
         * - String JSON : données sérialisées (parsées automatiquement)
         * - Object avec type : données structurées (ConfigData) avec un type spécifique
         * - Object simple : données à fusionner directement dans l'état
         *
         * Les données reçues sont fusionnées dans l'état datasFromHost qui est utilisé
         * par les composants pour afficher les informations système (Node, Puppeteer, etc.)
         */
        // Handler sendDatasToFront
        if (cleanupSendDatasRef.current) {
            cleanupSendDatasRef.current()
        }
        cleanupSendDatasRef.current = window.electronAPI.sendDatasToFront(
            (data: any): any => {
                if (typeof data === 'string') {
                    const _data = JSON.parse(data)
                    frontLog.debug(`sendDatasToFront is a string`, _data)
                    setDatasFromHost((oldObject: any) => ({
                        ...oldObject,
                        ..._data,
                    }))
                } else {
                    if (data.type && (data.result || data.error)) {
                        setDatasFromHost((oldObject: any) => {
                            const o: any = {
                                ...oldObject,
                            }
                            const type = (data as ConfigData).type
                            o[type] = data
                            return o
                        })
                    } else {
                        frontLog.debug(
                            `sendDatasToFront is object`,
                            JSON.stringify(data, null, 2)
                        )
                        setDatasFromHost((oldObject: any) => ({
                            ...oldObject,
                            ...data,
                        }))
                    }
                }
            }
        )

        /**
         * Écouteur pour les logs asynchrones du processus main.
         *
         * Ce handler capture tous les logs générés par le processus main
         * (via _sendMessageToFrontConsole) et les affiche dans la console de l'application.
         *
         * Fonctionnalités :
         * - Ajout d'un timestamp à chaque message
         * - Déduplication : ignore les messages identiques reçus dans les 100ms
         * - Formatage : combine le message principal avec les paramètres optionnels
         *
         * Les messages sont ajoutés à l'état consoleMessages qui est affiché
         * dans le composant ConsoleApp et dans la popin de chargement.
         */
        // Handler asynchronous-log
        // Créer la fonction une seule fois et la stocker dans le ref
        if (!handleConsoleMessageRef.current) {
            handleConsoleMessageRef.current = (
                _event: any,
                message: string,
                ...optionalParams: any[]
            ) => {
                const logMessage =
                    optionalParams && optionalParams.length > 0
                        ? `${message} ${optionalParams.join(' ')}`
                        : message || ''

                // Déduplication : ignorer les messages identiques reçus dans les 100ms
                const now = Date.now()
                const lastMessage = lastMessageRef.current
                if (
                    lastMessage &&
                    lastMessage.message === logMessage &&
                    now - lastMessage.timestamp < 100
                ) {
                    // Message dupliqué, l'ignorer
                    frontLog.debug('Duplicate message ignored:', logMessage)
                    return
                }

                // Mettre à jour la trace du dernier message
                lastMessageRef.current = { message: logMessage, timestamp: now }

                setConsoleMessages((prev) => {
                    const timestamp = new Date().toLocaleTimeString()
                    return `${prev}${prev ? '\n' : ''}[${timestamp}] ${logMessage}`
                })
            }
        }

        /**
         * Gestion de l'écouteur IPC pour les logs asynchrones.
         *
         * IMPORTANT : On retire TOUJOURS l'écouteur existant avant d'en ajouter un nouveau.
         * Cela évite les fuites mémoire et les écouteurs multiples qui causeraient
         * des messages dupliqués dans la console.
         *
         * Le flag isListenerAddedRef empêche d'ajouter plusieurs fois le même écouteur
         * si le useEffect se réexécute (même si cela ne devrait pas arriver avec []).
         */
        // Nettoyer TOUS les écouteurs existants pour ce channel avant d'en ajouter un nouveau
        // Cela garantit qu'il n'y a qu'un seul écouteur actif
        if (window.ipcRenderer && handleConsoleMessageRef.current) {
            // TOUJOURS retirer l'écouteur existant avant d'en ajouter un nouveau
            // Même si le flag indique qu'il n'a pas été ajouté, il pourrait y avoir un écouteur résiduel
            window.ipcRenderer.off(
                channels.ASYNCHRONOUS_LOG,
                handleConsoleMessageRef.current
            )

            // Ajouter le nouvel écouteur uniquement s'il n'a pas déjà été ajouté
            // Le flag empêche les ajouts multiples si le useEffect se réexécute
            if (!isListenerAddedRef.current) {
                window.ipcRenderer.on(
                    channels.ASYNCHRONOUS_LOG,
                    handleConsoleMessageRef.current
                )
                isListenerAddedRef.current = true
                frontLog.debug('asynchronous-log listener added')
            }
        }

        /**
         * Écouteur pour les changements de langue depuis le menu de l'application.
         *
         * Quand l'utilisateur change la langue via le menu (Menu > Language),
         * le processus main envoie un message au renderer pour mettre à jour i18next.
         *
         * Le changement de langue est appliqué immédiatement à toute l'interface.
         */
        // Handler changeLanguageInFront
        if (cleanupChangeLanguageRef.current) {
            cleanupChangeLanguageRef.current()
        }
        cleanupChangeLanguageRef.current =
            window.electronAPI.changeLanguageInFront((lng: string): any => {
                try {
                    i18nResources.changeLanguage(lng, (err, t) => {
                        if (err)
                            return frontLog.error(
                                'something went wrong loading',
                                err
                            )
                        t('key')
                    })
                } catch (error) {
                    frontLog.error(error)
                }
            })

        // Read language from Store
        const getLanguage = async () => {
            try {
                const gettedLng = await window.store.get(`language`, `fr`)
                if (gettedLng) {
                    i18nResources.changeLanguage(gettedLng)
                }
            } catch (error) {
                frontLog.debug(error)
            }
        }
        getLanguage()

        /**
         * Écouteur pour les messages d'initialisation de l'application.
         *
         * L'initialisation est lancée automatiquement au démarrage de l'application
         * depuis le processus main. Elle effectue plusieurs vérifications et installations :
         * - Vérification de Node.js
         * - Installation/vérification du navigateur Puppeteer
         * - Extraction de lib.asar (Windows uniquement)
         * - Configuration des répertoires de travail
         *
         * Types de messages reçus :
         * - type: 'data' : Données structurées (workDir, homeDir, appReady, etc.)
         * - type: 'message' : Messages de progression ou d'erreur
         *
         * modalType :
         * - 'started' : Affiche la popin d'initialisation
         * - 'completed' : Cache la popin après 2 secondes
         * - 'error' : Affiche la popin en mode alerte (erreur)
         */
        // Handler initialization messages
        if (!window.initialisationAPI) {
            frontLog.error('window.initialisationAPI is not available!')
            return
        }

        if (cleanupInitializationRef.current) {
            cleanupInitializationRef.current()
        }
        cleanupInitializationRef.current =
            window.initialisationAPI.sendInitializationMessages(
                async (message: InitalizationMessage) => {
                    frontLog.debug(`sendInitializationMessages`, message)

                    if (message.type === 'data') {
                        switch (message.data?.type) {
                            case InitalizationData.WORKDIR:
                                setWorkDir(message.data.result as string)
                                break
                            case InitalizationData.HOMEDIR:
                                setHomeDir(message.data.result as string)
                                break
                            case InitalizationData.APP_READY:
                                setAppReady(message.data.result as boolean)
                                break
                            case InitalizationData.PUPPETEER_BROWSER_INSTALLED:
                                setIsPuppeteerBrowserInstalled(
                                    message.data.result as boolean
                                )
                                setPuppeteerBrowserInstalledVersion(
                                    message.data.result as string
                                )
                                break
                            case InitalizationData.APP_CAN_NOT_BE_LAUNCHED:
                                setInformationPopinTitle(`${message.title}`)
                                setInformationPopinMessage(message.message)
                                break
                        }
                    } else {
                        setInformationPopinTitle(message.title)
                        setInformationPopinMessage(message.message)
                        setInformationPopinErrorLink(
                            message?.errorLink || { label: '', url: '' }
                        )
                    }

                    if (message.modalType === 'started') {
                        setDisplayInformationPopin(true)
                    } else if (message.modalType === 'completed') {
                        await sleep(2000)
                        setDisplayInformationPopin(false)
                    } else if (message.modalType === 'error') {
                        setDisplayInformationPopin(true)
                        setShowInformationSpinner(false)
                        setInformationPopinIsAlert(true)
                    }
                }
            )

        /**
         * Fonction de nettoyage exécutée au démontage du composant.
         *
         * IMPORTANT : Tous les écouteurs IPC doivent être correctement nettoyés
         * pour éviter les fuites mémoire et les comportements inattendus.
         *
         * Chaque écouteur a sa propre fonction de cleanup qui est appelée ici.
         */
        // Cleanup
        return () => {
            if (cleanupLinuxVersionRef.current) {
                cleanupLinuxVersionRef.current()
                cleanupLinuxVersionRef.current = null
            }
            if (cleanupSendDatasRef.current) {
                cleanupSendDatasRef.current()
                cleanupSendDatasRef.current = null
            }
            if (cleanupChangeLanguageRef.current) {
                cleanupChangeLanguageRef.current()
                cleanupChangeLanguageRef.current = null
            }
            if (cleanupInitializationRef.current) {
                cleanupInitializationRef.current()
                cleanupInitializationRef.current = null
            }
            if (
                window.ipcRenderer &&
                handleConsoleMessageRef.current &&
                isListenerAddedRef.current
            ) {
                window.ipcRenderer.off(
                    channels.ASYNCHRONOUS_LOG,
                    handleConsoleMessageRef.current
                )
                isListenerAddedRef.current = false
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Dépendances vides : les listeners ne doivent être ajoutés qu'une seule fois au montage
}
