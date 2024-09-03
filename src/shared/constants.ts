type IConstants = {
    store: { [key: string]: string }
    channels: { [key: string]: string }
    scripts: { [key: string]: string }
    utils: {
        JSON_FILE_NAME: string
        DEFAULT_JSON_DATA: IJsonMesureData
        LOWER_NODE_VERSION: number
    }
}
const constants: IConstants = {
    store: {
        APP_INSTALLED_ONCE: `app_installed_done_once`,
    },
    channels: {
        INITIALIZATION_APP: 'initialization-app',
        INITIALIZATION_DATAS: 'initialization-datas',
        ASYNCHRONOUS_LOG: 'asynchronous-log',
        SIMPLE_MESURES: 'simple-mesures',
        JSON_MESURES: 'json-mesures',
        SAVE_JSON_FILE: 'save-json-file',
        READ_RELOAD_JSON_FILE: 'read-reload-json-file',
        // JSON_FILE_FOUNDED: 'readed-json-file',
        GET_WORKDIR: 'get-workdir',
        GET_HOMEDIR: 'get-homedir',
        GET_NODE_VERSION: 'get-node-version',
        SELECT_FOLDER: 'dialog:select-folder',
        IS_LIGHTHOUSE_ECOINDEX_INSTALLED: 'is-lighthouse-ecoindex-installed',
        IS_NODE_INSTALLED: 'is-node-installed',
        IS_JSON_CONFIG_FILE_EXIST: 'is-json-config-file-exist',
        INSTALL_LIGHTHOUSE_PLUGIN_ECOINDEX: 'install-ecoindex-plugin',
        // UPDATE_ECOINDEX_PLUGIN: 'update-ecoindex-plugin',
        // INSTALL_OR_UPDATE_ECOINDEX_PLUGIN: 'install-or-update-ecoindex-plugin',
        HOST_INFORMATIONS: 'host-informations',
        HOST_INFORMATIONS_BACK: 'host-informations-back',
        OPEN_REPORT: 'open-report',
        GET_INITIAL_TRANSLATIONS: 'get-initial-translations',
        CHANGE_LANGUAGE_TO_FRONT: 'change-language-to-front',
        INSTALL_PUPPETEER_BROWSER: 'install-puppeteer-browser',
        SHOW_HIDE_WELCOME_WINDOW: 'show-hide-welcome-window',
    },
    scripts: {
        GET_NODE: 'get-node',
        GET_NODE_VERSION: 'get-node-version',
        // INSTALL_PLUGIN_AND_UTILS: 'install-lighthouse-plugin-ecoindex',
        INSTALL_LIGHTHOUSE_PLUGIN_ECOINDEX:
            'install-lighthouse-plugin-ecoindex',
        INSTALL_PUPPETEER_BROWSER: 'install-puppetter-browser',
        UPDATED_PLUGIN: 'update-plugin',
    },
    utils: {
        LOWER_NODE_VERSION: 18,
        JSON_FILE_NAME: 'input-file.json',
        DEFAULT_JSON_DATA: {
            'extra-header': {
                Cookie: 'monster=blue',
                'x-men': 'wolverine',
                Authorization: 'Basic c3BpZTpFaXBzRXJnb1N1bTQyJA==',
            },
            output: ['html'],
            'user-agent': 'insights',
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
