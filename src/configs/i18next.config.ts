import * as path from 'node:path'

import i18n, { use as i18nUse, init } from 'i18next'

import Backend from 'i18next-fs-backend'
import { app } from 'electron'

let initPromise: Promise<void> | null = null

const initializeI18n = async (): Promise<void> => {
    if (initPromise) {
        return initPromise
    }

    initPromise = (async () => {
        try {
            const IS_PROD = process.env.NODE_ENV === 'production'
            const root = process.cwd()
            const isPackaged = app ? app.isPackaged : false

            // Si déjà initialisé, on attend que les traductions soient chargées
            if (i18n.isInitialized) {
                await i18n.loadNamespaces('translation')
                return
            }

            i18nUse(Backend)

            // Déterminer le chemin des traductions
            let localesPath: string
            if (isPackaged && process.resourcesPath) {
                // En production packagée : utiliser process.resourcesPath
                localesPath = path.join(
                    process.resourcesPath,
                    'locales/{{lng}}/{{ns}}.json'
                )
            } else {
                // En développement : utiliser le chemin du projet
                localesPath = path.join(root, 'src/locales/{{lng}}/{{ns}}.json')
            }

            // Initialiser i18next et attendre que les traductions soient chargées
            await init({
                debug: !IS_PROD,
                lng: 'en',
                fallbackLng: 'en',
                interpolation: {
                    escapeValue: false,
                },
                backend: {
                    loadPath: localesPath,
                },
            })

            i18n.languages = ['en', 'fr']

            // Charger explicitement le namespace translation
            await i18n.loadNamespaces('translation')
        } catch (error) {
            // getMainLog peut ne pas être disponible au chargement du module
            // donc on utilise un import dynamique
            const { getMainLog } = await import('../main/main')
            const mainLog = getMainLog()
            mainLog.error('i18n initialization error:', error)
            throw error
        }
    })()

    return initPromise
}

// Initialiser automatiquement au chargement du module
// Ne pas bloquer le démarrage si l'initialisation échoue
initializeI18n().catch(async (error) => {
    // getMainLog peut ne pas être disponible au chargement du module
    // donc on utilise un import dynamique
    const { getMainLog } = await import('../main/main')
    const mainLog = getMainLog()
    mainLog.error('Failed to initialize i18n (non-blocking):', error)
    // Ne pas throw pour ne pas bloquer le chargement du module
})

export default i18n
export { initializeI18n }
