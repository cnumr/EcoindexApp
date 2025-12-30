/*
 * Copyright 2018 forCandies <work@forcandies.com> (http://forcandies.com)
 *
 * ISC License
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose with or without fee is hereby granted, provided
 * that the above copyright notice and this permission notice appear
 * in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL
 * WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL
 * THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR
 * CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
 * NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
 * CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

import { app, autoUpdater, dialog } from 'electron'

import { format } from 'util'
import i18n from '../configs/i18next.config'
import log from 'electron-log'
import os from 'node:os'
import pkg from '../../package.json'

const updaterLog = log.scope('main/Updater')

// Utiliser app.isPackaged pour détecter si l'application est en production
// app.isPackaged est true quand l'application est packagée (build de production)
// et false en mode développement
let IS_PROD: boolean = app.isPackaged
const FORCE_FOR_DEBUG: boolean = false

/**
 * IS NOT WORKING BECAUSE OF THE CHOICE TO HAVE `electron-vX.Y.x` AS TAGNAME THAT IS NOT SEMVER COMPLIANT..
 */
let version = `${app.getVersion()}`

if (FORCE_FOR_DEBUG) {
    IS_PROD = true
    version = '1.3.8'
}

/**
 * Updater class for macOS and Windows
 * Linux uses a different update mechanism (see main.ts)
 */
class Updater {
    /**
     * @type {Updater}
     */
    private static instance: Updater = new Updater()

    /**
     * @type {boolean}
     */
    private isSilentMode = true

    /**
     *
     */
    constructor() {
        if (Updater.instance) {
            throw new Error(
                'Error: Instantiation failed: Use Updater.getInstance() instead of new.'
            )
        }

        // Construction dynamique de l'URL de feed depuis package.json
        updaterLog.debug(`IS_PROD`, IS_PROD)
        if (IS_PROD) {
            const _arch = os.arch()

            // Extraire le repository depuis package.json
            // Format attendu: "owner/repo" ou "https://github.com/owner/repo"
            let repoPath = 'cnumr/EcoindexApp' // Valeur par défaut
            const pkgAny = pkg as any
            if (pkgAny.repository) {
                if (typeof pkgAny.repository === 'string') {
                    // Si c'est une string, extraire owner/repo
                    const match = pkgAny.repository.match(
                        /github\.com[/:]([^/]+\/[^/]+)/
                    )
                    if (match) {
                        repoPath = match[1].replace(/\.git$/, '')
                    }
                } else if (pkgAny.repository.url) {
                    // Si c'est un objet avec une URL
                    const match = pkgAny.repository.url.match(
                        /github\.com[/:]([^/]+\/[^/]+)/
                    )
                    if (match) {
                        repoPath = match[1].replace(/\.git$/, '')
                    }
                }
            }

            // Utiliser la version depuis package.json ou app.getVersion()
            const currentVersion = version || pkg.version || app.getVersion()

            const userAgent = format(
                '%s/%s (%s: %s)',
                pkg.productName || pkg.name,
                currentVersion,
                os.platform(),
                _arch
            )

            // Configurer l'URL du feed pour update.electronjs.org
            // update.electronjs.org est un service gratuit qui convertit les releases GitHub
            // en format compatible avec l'auto-updater natif d'Electron
            // Format: https://update.electronjs.org/{owner}/{repo}/{platform}-{arch}/{version}
            const feedUrl = `https://update.electronjs.org/${repoPath}/${process.platform}-${_arch}/${currentVersion}`

            updaterLog.log('feedUrl', feedUrl)
            updaterLog.log('userAgent', userAgent)
            updaterLog.log('repoPath (from package.json)', repoPath)
            updaterLog.log('version (from package.json)', currentVersion)

            autoUpdater.setFeedURL({
                url: feedUrl,
                headers: { 'User-Agent': userAgent },
            })

            this.create()
        } else {
            updaterLog.debug('Auto-Updater disabled (dev-mode)')
        }

        Updater.instance = this
    }

    /**
     * @param {boolean} isSilentMode
     */
    public checkForUpdates(isSilentMode = true): void {
        if (!IS_PROD) {
            return
        }

        this.isSilentMode = isSilentMode
        updaterLog.debug(`checkForUpdates (isSilentMode)`, isSilentMode)
        autoUpdater.checkForUpdates()
    }

    /**
     *
     */
    protected create(): void {
        autoUpdater.on('error', this.onError.bind(this))
        autoUpdater.on(
            'checking-for-update',
            this.onCheckingOnUpdate.bind(this)
        )
        autoUpdater.on('update-available', this.onUpdateAvailable.bind(this))
        autoUpdater.on(
            'update-not-available',
            this.onUpdateNotAvailable.bind(this)
        )
        autoUpdater.on(
            'update-downloaded',

            this.onUpdateDownloaded.bind(this) as any
        )

        setInterval(() => this.checkForUpdates(), 60 * 60 * 1000)
    }

    /**
     * @param {Error} error
     */
    protected onError(error: Error): void {
        updaterLog.error('updater error')
        updaterLog.error(error)
    }

    /**
     *
     */
    protected onCheckingOnUpdate(): void {
        updaterLog.log('checking-for-update')
    }

    /**
     *
     */
    protected onUpdateAvailable(): void {
        if (!this.isSilentMode) {
            dialog.showMessageBox({
                type: 'info',
                message: i18n.t('update.newVersionAvailable'),
                detail: i18n.t('update.downloadingInBackground'),
            })
        }

        updaterLog.log('update-available; downloading...')
    }

    /**
     *
     */
    protected onUpdateNotAvailable(): void {
        if (!this.isSilentMode) {
            dialog.showMessageBox({
                type: 'info',
                message: i18n.t('update.upToDate'),
                detail: i18n.t('update.currentVersionIsNewest', { version }),
            })
        }

        updaterLog.log('update-not-available')
    }

    /**
     * @param {Event} _
     * @param {string} releaseNotes
     * @param {string} releaseName
     * @param {Date} _releaseDate
     * @param {string} _updateURL
     */
    protected onUpdateDownloaded(
        _: Event,
        releaseNotes: string,
        releaseName: string,
        _releaseDate: Date,
        _updateURL: string
    ): void {
        updaterLog.log('update-downloaded', {
            releaseName,
            releaseDate: _releaseDate,
            updateURL: _updateURL,
            releaseNotes,
        })

        const options = {
            type: 'info' as const,
            buttons: [i18n.t('update.restart'), i18n.t('update.later')],
            title: i18n.t('update.applicationUpdate'),
            message: process.platform === 'win32' ? releaseNotes : releaseName,
            detail: i18n.t('update.restartToApply'),
        }

        // dialog.showMessageBox avec callback pour compatibilité avec l'auto-updater natif

        ;(dialog.showMessageBox as any)(options, (response: number) => {
            if (response === 0) {
                autoUpdater.quitAndInstall()
            }
        })
    }

    /**
     * @returns {Updater}
     */
    public static getInstance(): Updater {
        return Updater.instance
    }
}

export default Updater
