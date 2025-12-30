import { BrowserWindow, app as ElectronApp, shell } from 'electron'

import Store from 'electron-store'
import log from 'electron-log'
import i18n from '../../configs/i18next.config'
import pkg from '../../../package.json'
import { channels } from '../../shared/constants'

const mainLog = log.scope('main/darwinMenu')
const store = new Store()

// Configuration des langues disponibles
const lngs = [
    { code: 'fr', lng: 'Français' },
    { code: 'en', lng: 'English' },
]

import type { MenuItemConstructorOptions } from 'electron'

export const darwinTemplate = (
    app: typeof ElectronApp,
    _mainWindow: BrowserWindow,
    _i18n: typeof i18n
): MenuItemConstructorOptions[] => {
    try {
        const logFile = log.transports.file.getFile().path

        // Menu de langue
        const languageMenu = lngs.map((languageCode) => {
            return {
                label: languageCode.lng,
                type: 'radio' as const,
                checked: _i18n.language === languageCode.code,
                click: () => {
                    store.set('language', languageCode.code)
                    _i18n.changeLanguage(languageCode.code).then(() => {
                        // Notifier toutes les fenêtres avec les deux événements nécessaires
                        BrowserWindow.getAllWindows().forEach((window) => {
                            window.webContents.send(
                                channels.LANGUAGE_CHANGED,
                                languageCode.code
                            )
                            window.webContents.send(
                                channels.CHANGE_LANGUAGE_TO_FRONT,
                                languageCode.code
                            )
                        })
                        // Le menu sera reconstruit automatiquement via l'événement 'languageChanged' de i18next
                    })
                },
            }
        })

        const menu: MenuItemConstructorOptions[] = [
            {
                label: app.getName(),
                submenu: [
                    {
                        label: `${_i18n.t('menu.about')} ${pkg.productName}`,
                        role: 'about',
                    },
                    {
                        type: 'separator',
                    },
                    {
                        label: _i18n.t('menu.hideApp'),
                        accelerator: 'Command+H',
                        role: 'hide',
                    },
                    {
                        label: _i18n.t('menu.hideOthers'),
                        accelerator: 'Command+Shift+H',
                        role: 'hideOthers',
                    },
                    {
                        label: _i18n.t('menu.showAll'),
                        role: 'unhide',
                    },
                    {
                        type: 'separator',
                    },
                    {
                        label: _i18n.t('menu.quit'),
                        accelerator: 'Command+Q',
                        click: () => {
                            app.quit()
                        },
                    },
                ],
            },
            {
                label: _i18n.t('menu.edit'),
                submenu: [
                    { label: _i18n.t('menu.undo'), role: 'undo' },
                    { label: _i18n.t('menu.redo'), role: 'redo' },
                    { type: 'separator' },
                    { label: _i18n.t('menu.cut'), role: 'cut' },
                    { label: _i18n.t('menu.copy'), role: 'copy' },
                    { label: _i18n.t('menu.paste'), role: 'paste' },
                    {
                        label: _i18n.t('menu.pasteAndMatchStyle'),
                        role: 'pasteAndMatchStyle',
                    },
                    { label: _i18n.t('menu.delete'), role: 'delete' },
                    { label: _i18n.t('menu.selectAll'), role: 'selectAll' },
                    { type: 'separator' },
                    {
                        label: _i18n.t('menu.speech'),
                        submenu: [
                            {
                                label: _i18n.t('menu.startSpeaking'),
                                role: 'startSpeaking',
                            },
                            {
                                label: _i18n.t('menu.stopSpeaking'),
                                role: 'stopSpeaking',
                            },
                        ],
                    },
                ],
            },
            {
                label: _i18n.t('menu.view'),
                submenu: [
                    {
                        label: _i18n.t('menu.reload'),
                        accelerator: 'Command+R',
                        click: (_: any, focusedWindow) => {
                            if (focusedWindow && 'reload' in focusedWindow) {
                                ;(focusedWindow as BrowserWindow).reload()
                            }
                        },
                    },
                    {
                        role: 'forceReload',
                        label: _i18n.t('menu.forceReload'),
                    },
                    {
                        label: _i18n.t('menu.fullScreen'),
                        accelerator: 'Ctrl+Command+F',
                        click: (_: any, focusedWindow) => {
                            if (
                                focusedWindow &&
                                'setFullScreen' in focusedWindow
                            ) {
                                const win = focusedWindow as BrowserWindow
                                win.setFullScreen(!win.isFullScreen())
                            }
                        },
                    },
                    {
                        label: _i18n.t('menu.minimize'),
                        accelerator: 'Command+M',
                        role: 'minimize',
                    },
                    {
                        type: 'separator',
                    },
                    {
                        label: _i18n.t('menu.toggleDeveloperTools'),
                        accelerator: 'Alt+Command+I',
                        click: (_: any, focusedWindow) => {
                            if (
                                focusedWindow &&
                                'webContents' in focusedWindow
                            ) {
                                ;(
                                    focusedWindow as BrowserWindow
                                ).webContents.toggleDevTools()
                            }
                        },
                    },
                ],
            },
            {
                label: _i18n.t('menu.language'),
                submenu: languageMenu,
            },
            {
                label: _i18n.t('menu.help'),
                submenu: [
                    {
                        label: `${_i18n.t('menu.learnMoreAbout')} ${pkg.productName}`,
                        click: async () => {
                            await shell.openExternal(
                                'https://cnumr.github.io/lighthouse-plugin-ecoindex/'
                            )
                        },
                    },
                    {
                        type: 'separator',
                    },
                    {
                        label: _i18n.t('Open splash window...'),
                        click: async () => {
                            const { handleSplashScreen } =
                                await import('../handlers/initHandlers/HandleSplashScreen')
                            await handleSplashScreen(null, 'resetAndDisplay')
                        },
                    },
                    {
                        label: _i18n.t('menu.log'),
                        click: async () => {
                            await shell.openPath(logFile)
                        },
                    },
                ],
            },
        ]

        return menu
    } catch (error) {
        mainLog.error('Error in darwinTemplate', error)
        return []
    }
}
