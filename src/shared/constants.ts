import type { IAdvancedMesureData, IJsonMesureData } from '../interface'

type IConstants = {
    store: { [key: string]: string }
    channels: { [key: string]: string }
    scripts: { [key: string]: string }
    utils: {
        JSON_FILE_NAME: string
        DEFAULT_ADV_CONFIG: IAdvancedMesureData
        DEFAULT_JSON_DATA: IJsonMesureData
        LOWER_NODE_VERSION: number
        DOWNLOAD_NODE_LINK: string
    }
}

const advConfig: IAdvancedMesureData = {
    'extra-header': {
        Cookie: 'monster=blue',
        'x-men': 'wolverine',
        Authorization: 'Basic c3BpZTpFaXBzRXJnb1N1bTQyJA==',
    },
    'audit-category': [
        'performance',
        'seo',
        'accessibility',
        'best-practices',
        'lighthouse-plugin-ecoindex-core',
    ],
    output: ['html'],
    'user-agent': 'random',
}

const constants: IConstants = {
    store: {
        APP_INSTALLED_ONCE: `app_installed_done_once`,
    },
    channels: {
        INITIALIZATION_APP: 'initialization-app',
        INITIALIZATION_DATAS: 'initialization-datas',
        INITIALIZATION_MESSAGES: 'initialization-messages',
        ASYNCHRONOUS_LOG: 'asynchronous-log',
        SIMPLE_MESURES: 'simple-mesures',
        JSON_MESURES: 'json-mesures',
        SAVE_JSON_FILE: 'save-json-file',
        READ_RELOAD_JSON_FILE: 'read-reload-json-file',
        GET_WORKDIR: 'get-workdir',
        GET_HOMEDIR: 'get-homedir',
        GET_NODE_VERSION: 'get-node-version',
        SELECT_FOLDER: 'dialog:select-folder',
        SELECT_PUPPETEER_FILE: 'dialog:select-puppeteer-file',
        IS_LIGHTHOUSE_ECOINDEX_INSTALLED: 'is-lighthouse-ecoindex-installed',
        IS_NODE_INSTALLED: 'is-node-installed',
        IS_JSON_CONFIG_FILE_EXIST: 'is-json-config-file-exist',
        INSTALL_LIGHTHOUSE_PLUGIN_ECOINDEX: 'install-ecoindex-plugin',
        HOST_INFORMATIONS: 'host-informations',
        HOST_INFORMATIONS_BACK: 'host-informations-back',
        OPEN_REPORT: 'open-report',
        GET_INITIAL_TRANSLATIONS: 'get-initial-translations',
        CHANGE_LANGUAGE_TO_FRONT: 'change-language-to-front',
        INSTALL_PUPPETEER_BROWSER: 'install-puppeteer-browser',
        SHOW_HIDE_WELCOME_WINDOW: 'show-hide-welcome-window',
        ALERT_LINUX_UPDATE: 'alert-linux-update',
        DISPLAY_SPLASH_SCREEN: 'display-splash-screen',
        // Channels pour la gestion de la langue
        LANGUAGE_CHANGED: 'language-changed',
        CHANGE_LANGUAGE: 'change-language',
        GET_LANGUAGE: 'get-language',
        // Channels pour l'API store
        STORE_SET: 'store-set',
        STORE_GET: 'store-get',
        STORE_DELETE: 'store-delete',
        // Channel pour les messages du main process
        MAIN_PROCESS_MESSAGE: 'main-process-message',
        // Channel pour les boîtes de dialogue
        SHOW_CONFIRM_DIALOG: 'show-confirm-dialog',
        // Channel pour tester l'auto-updater (dev uniquement)
        TEST_UPDATE_DIALOG: 'test-update-dialog',
    },
    scripts: {
        GET_NODE: 'get-node',
        GET_NODE_VERSION: 'get-node-version',
        INSTALL_LIGHTHOUSE_PLUGIN_ECOINDEX:
            'install-lighthouse-plugin-ecoindex',
        INSTALL_PUPPETEER_BROWSER: 'install-puppetter-browser',
        UPDATED_PLUGIN: 'update-plugin',
    },
    utils: {
        LOWER_NODE_VERSION: 20,
        DOWNLOAD_NODE_LINK: 'https://nodejs.org/en/download/',
        JSON_FILE_NAME: 'input-file.json',
        DEFAULT_ADV_CONFIG: advConfig,
        DEFAULT_JSON_DATA: {
            ...advConfig,
            'output-name': 'ecoindex',
            courses: [
                {
                    name: 'BEST PAGES',
                    target: 'TBD.',
                    course: 'Not applicable on bests pages',
                    'is-best-pages': true,
                    urls: [
                        { value: 'https://www.ecoindex.fr/' },
                        { value: 'https://www.ecoindex.fr/comment-ca-marche/' },
                        { value: 'https://www.ecoindex.fr/ecoconception/' },
                        { value: 'https://www.ecoindex.fr/a-propos/' },
                        { value: 'https://www.ecoindex.fr/nous-rejoindre/' },
                    ],
                },
                {
                    name: 'DISCOVERY',
                    target: 'Visit the website and join the association.',
                    course: 'Consult the site pages, understand the ecoindex, discover eco-design and join the association',
                    'is-best-pages': false,
                    urls: [
                        { value: 'https://www.ecoindex.fr/' },
                        { value: 'https://www.ecoindex.fr/comment-ca-marche/' },
                        { value: 'https://www.ecoindex.fr/ecoconception/' },
                        { value: 'https://www.ecoindex.fr/a-propos/' },
                        { value: 'https://www.ecoindex.fr/nous-rejoindre/' },
                    ],
                },
            ],
        },
    },
}
export const channels = constants.channels
export const utils = constants.utils
export const scripts = constants.scripts
export const store = constants.store
