import i18n from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import log from 'electron-log/renderer'

const frontLog = log.scope('front/i18nResources')

try {
    i18n.use(
        resourcesToBackend(
            (language: string, namespace: string) =>
                import(`../locales/${language}/${namespace}.json`)
        )
    )
    i18n.on('failedLoading', (_lng, _ns, msg) => frontLog.error(msg))

    // Initialiser avec la langue par défaut
    // La langue sauvegardée sera chargée dans le composant LanguageSwitcher
    i18n.init({
        debug: false, // Désactiver en production
        lng: 'en',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
        missingKeyHandler: (lng, _ns, key, fallbackValue) => {
            frontLog.warn(
                `Missing translation key: "${key}" for language "${lng}"`
            )
            return fallbackValue || key
        },
    })

    i18n.languages = ['en', 'fr']

    // Charger la langue sauvegardée après l'initialisation
    if (typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.getLanguage().then((lang) => {
            if (lang && lang !== i18n.language) {
                i18n.changeLanguage(lang)
            }
        })
    }
} catch (error) {
    frontLog.error('i18n initialization error:', error)
}

export default i18n
