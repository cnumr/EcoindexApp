import { useEffect, useState } from 'react'

import { AlertBox } from './Alert'
import { Button } from '../ui/button'
import { ConfigData } from '../../class/ConfigData'
import { SimpleTooltip } from './simple-tooltip'
import log from 'electron-log/renderer'
import { useTranslation } from 'react-i18next'

type ErrorAlert = {
    launchInitialization: (force: boolean) => void
    datasFromHost: object
}
const frontLog = log.scope(`front/initErrorAlert`)
export const InitErrorAlerts = ({
    launchInitialization,
    datasFromHost,
}: ErrorAlert) => {
    const [isFirstStart, setIsFirstStart] = useState(false)
    const [isNodeInError, setIsNodeInError] = useState(false)
    const [isNodeVersionInError, setIsNodeVersionInError] = useState(false)
    const [isWriteAccessInError, setIsWriteAccessInError] = useState(false)
    const [isGenericInError, setIsGenericInError] = useState(false)
    const [isWriteAccessCantFix, setIsWriteAccessCantFix] = useState(false)
    const [isBrowserInError, setIsBrowserInError] = useState(false)
    const [isNpmDirInError, setIsNpmDirInError] = useState(false)

    const { t } = useTranslation()

    /**
     * Handler to open URL of the official Node.js installer.
     */
    const installNode = () => {
        window.open(
            `https://nodejs.org/en/download/prebuilt-installer`,
            `_blank`
        )
    }

    /**
     * Handlers, force window refresh
     */
    const forceRefresh = () => {
        // getMainWindow().webContents.reload()
        window.location.reload()
    }

    /**
     * Handler to copy in clipboard the content of datasFromHost.
     */
    const copyToClipBoard = () => {
        navigator.clipboard.writeText(JSON.stringify(datasFromHost, null, 2))
    }

    useEffect(() => {
        /**
         * Add "listeners" for initialisationAPI.sendConfigDatasToFront()
         */
        window.initialisationAPI.sendConfigDatasToFront(
            (configData: ConfigData) => {
                try {
                    frontLog.debug(`configData`, configData)
                    // If app ready, hide button Init Installation
                    if (
                        configData.type === ConfigData.APP_READY &&
                        configData.result === true
                    ) {
                        setIsFirstStart(false)
                    }
                    if (configData.type !== ConfigData.APP_CAN_NOT_BE_LAUNCHED)
                        return
                    if (
                        configData.error &&
                        process.env['WEBPACK_SERVE'] === 'true'
                    ) {
                        window.alert(
                            `${configData.type} : ${configData.message ? configData.message : configData.error}`
                        )
                    }
                    switch (configData.errorType) {
                        case ConfigData.ERROR_TYPE_FIRST_INSTALL:
                            setIsFirstStart(true)
                            break
                        case ConfigData.ERROR_TYPE_NO_NODE:
                            setIsNodeInError(true)
                            setIsGenericInError(true)
                            break
                        case ConfigData.ERROR_TYPE_NO_WRITE_ACCESS:
                            setIsWriteAccessInError(true)
                            setIsGenericInError(true)
                            break
                        case ConfigData.ERROR_TYPE_CANT_FIX_USER_RIGHTS:
                            setIsWriteAccessCantFix(true)
                            setIsGenericInError(true)
                            break
                        case ConfigData.ERROR_TYPE_BROWSER_NOT_INSTALLED:
                            setIsBrowserInError(true)
                            setIsGenericInError(true)
                            break
                        case ConfigData.ERROR_TYPE_NODE_VERSION_ERROR:
                            setIsNodeVersionInError(true)
                            setIsGenericInError(true)
                            break
                        case ConfigData.ERROR_TYPE_NO_NPM_DIR:
                            setIsNpmDirInError(true)
                            setIsGenericInError(true)
                            break

                        default:
                            if (configData.errorType) {
                                alert(
                                    `ConfigData.errorType=${configData.errorType} not handle in App.tsx`
                                )
                            }
                    }
                } catch (error) {
                    frontLog.error(`Error`, error)
                }
            }
        )
    }, [])

    return (
        <>
            {isFirstStart && (
                <AlertBox title={t('First launch')} variant="default">
                    <div className="flex items-center justify-between gap-4">
                        <span>
                            {t(
                                `It's the first time you are using the application, you must start the addons installation.`
                            )}
                        </span>
                        <Button
                            variant="default"
                            id="bt-install-node"
                            onClick={() => launchInitialization(true)}
                        >
                            {t('Install')}
                        </Button>
                    </div>
                </AlertBox>
            )}
            {isNodeInError && (
                <AlertBox title={t('Error on Node')}>
                    <div className="flex items-center justify-between gap-4">
                        <span>
                            {t(
                                'Node is not installed, install it (you must be admin of your computer)! After installation, restart application.'
                            )}
                        </span>
                        <Button
                            variant="destructive"
                            id="bt-install-node"
                            onClick={installNode}
                        >
                            {t('Install')}
                        </Button>
                    </div>
                </AlertBox>
            )}
            {isNodeVersionInError && (
                <AlertBox title={t('Error on Node Version')}>
                    <div className="flex items-center justify-between gap-4">
                        <span>
                            {t(
                                'Your Node installation is outdated, you must upgrade it to 20 or upper, upgrade it (you must be admin of your computer)! After upgrade, restart application.'
                            )}
                        </span>
                        <Button variant="destructive" onClick={installNode}>
                            {t('Upgrade')}
                        </Button>
                    </div>
                </AlertBox>
            )}
            {isWriteAccessInError && (
                <AlertBox title={t('Permissions Error')}>
                    <div className="flex items-center justify-between gap-4">
                        <span>
                            {t(
                                `You must accept and enter your password, when prompted, in order to install the necessary elements.`
                            )}
                        </span>
                        <Button variant="destructive" onClick={forceRefresh}>
                            {t('Retry')}
                        </Button>
                    </div>
                </AlertBox>
            )}
            {isGenericInError && (
                <AlertBox variant="bug" title={t('Report error')}>
                    <div className="flex items-center justify-between gap-4">
                        <span>
                            {t(
                                "You have an error but you think it's a bug. Report to the developper by clicking the button (datas are saved to your clipboard) and send theim by mail to "
                            )}
                            <a
                                href="mailto:renaud@greenit.fr"
                                className="underline"
                            >
                                renaud@greenit.fr
                            </a>{' '}
                            🙏
                        </span>
                        <SimpleTooltip
                            tooltipContent={
                                <p>
                                    {t(
                                        'Copy application informations to clipboard.'
                                    )}
                                </p>
                            }
                        >
                            <Button
                                id="bt-report"
                                variant="default"
                                onClick={copyToClipBoard}
                            >
                                {t('Report')}
                            </Button>
                        </SimpleTooltip>
                    </div>
                </AlertBox>
            )}
        </>
    )
}
