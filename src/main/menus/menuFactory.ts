import { BrowserWindow, Menu, app as ElectronApp } from 'electron'

import log from 'electron-log'
import i18n from '../../configs/i18next.config'
import { darwinTemplate } from './darwinMenu'
import { otherTemplate } from './otherMenu'

const mainLog = log.scope('main/menuFactory')

// Références pour reconstruire le menu lors des changements de langue
let currentApp: typeof ElectronApp | null = null
let currentMainWindow: BrowserWindow | null = null

// Écouter les changements de langue pour reconstruire le menu automatiquement
i18n.on('languageChanged', () => {
    if (currentApp && currentMainWindow) {
        mainLog.debug('Language changed, rebuilding menu...')
        buildMenu(currentApp, currentMainWindow, i18n)
    }
})

export const buildMenu = (
    app: typeof ElectronApp,
    mainWindow: BrowserWindow,
    _i18n: typeof i18n
) => {
    try {
        // Sauvegarder les références pour la reconstruction automatique
        currentApp = app
        currentMainWindow = mainWindow

        if (process.platform === 'darwin') {
            const menu = Menu.buildFromTemplate(
                darwinTemplate(app, mainWindow, _i18n)
            )
            Menu.setApplicationMenu(menu)
        } else {
            const menu = Menu.buildFromTemplate(
                otherTemplate(app, mainWindow, _i18n)
            )
            mainWindow.setMenu(menu)
        }
    } catch (error) {
        mainLog.error('Error in buildMenu', error)
    }
}
