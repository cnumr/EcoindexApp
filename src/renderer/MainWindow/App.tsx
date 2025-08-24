import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../ui/card'
import { InitalizationMessage, InputField } from '../../types'
import { Route, MemoryRouter as Router, Routes } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { store as storeConstants, utils } from '../../shared/constants'
import { useCallback, useEffect, useState } from 'react'

import { Bug } from 'lucide-react'
import { Button } from '@/renderer/ui/button'
import { ConfigData } from '../../class/ConfigData'
import { ConsoleApp } from '../components/console'
import { DarkModeSwitcher } from '../components/dark-mode-switcher'
import { Footer } from '../components/footer'
import { Header } from '../components/Header'
import { InformationPopin } from '../components/information-popin'
import { InitErrorAlerts } from '../components/initialization-error-alerts'
import { InitalizationData } from '../../class/InitalizationData'
import { Input } from '../ui/input'
import { JsonPanMesure } from '../components/json-pan'
import { LinuxUpdate } from '../../class/LinuxUpdate'
import { MySkeleton } from '../components/my-skeleton'
import { PopinLoading } from '../components/loading-popin'
import { ReloadIcon } from '@radix-ui/react-icons'
import { SimplePanMesure } from '../components/simple-pan'
import { SimpleTooltip } from '../components/simple-tooltip'
import { SplashScreen } from '../components/splash-screen'
import { TabsContent } from '@radix-ui/react-tabs'
import { TypographyP } from '../ui/typography/TypographyP'
import { cn } from '../lib/utils'
import i18nResources from '../../configs/i18nResources'
import log from 'electron-log/renderer'
import packageJson from '../../../package.json'
import { useTranslation } from 'react-i18next'

const frontLog = log.scope('front/App')

function TheApp() {
    // #region useState, useTranslation
    // const [language, setLanguage] = useState('en')
    const [progress, setProgress] = useState(0)
    const [isJsonFromDisk, setIsJsonFromDisk] = useState(false)
    const [workDir, setWorkDir] = useState('loading...')
    const [homeDir, setHomeDir] = useState('loading...')
    const [appReady, setAppReady] = useState(false)
    const [datasFromHost, setDatasFromHost] = useState({})
    const [displayPopin, setDisplayPopin] = useState(false)
    const [displaySplashScreen, setDisplaySplashScreen] = useState(false)
    const [popinText, setPopinText] = useState('')
    const [isFirstStart, setIsFirstStart] = useState(true)
    const [isPuppeteerBrowserInstalled, setIsPuppeteerBrowserInstalled] =
        useState(false)
    const [
        puppeteerBrowserInstalledVersion,
        setPuppeteerBrowserInstalledVersion,
    ] = useState('loading...')

    const [displayReloadButton, setDisplayReloadButton] = useState(false)
    // #region displayInformationPopin
    const [displayInformationPopin, setDisplayInformationPopin] =
        useState(false)
    const [informationPopinTitle, setInformationPopinTitle] = useState('')
    const [informationPopinErrorLink, setInformationPopinErrorLink] = useState({
        label: '',
        url: '',
    })
    const [informationPopinMessage, setInformationPopinMessage] = useState('')
    const [informationPopinIsAlert, setInformationPopinIsAlert] =
        useState(false)
    const [showInformationSpinner, setShowInformationSpinner] = useState(true)
    // #endregion

    const [urlsList, setUrlsList] = useState<InputField[]>([
        { value: 'https://www.ecoindex.fr/' },
        { value: 'https://www.ecoindex.fr/a-propos/' },
    ])
    const [jsonDatas, setJsonDatas] = useState<IJsonMesureData>(
        utils.DEFAULT_JSON_DATA
    )

    const { t } = useTranslation()

    // endregion

    // region utils

    let timeOut: NodeJS.Timeout = null
    /**
     * Utils, wait method.
     * @param {number} ms Milisecond of the timer.
     * @param {boolean} clear clear and stop the timer.
     * @returns Promise<unknown>
     */
    async function _sleep(ms: number, clear = false) {
        if (clear) {
            frontLog.debug(`sleep cleared.`)
            clearTimeout(timeOut)
            return
        }
        return new Promise((resolve) => {
            frontLog.debug(`wait ${ms / 1000}s`)
            if (timeOut) {
                clearTimeout(timeOut)
                frontLog.debug(`sleep reseted.`)
            }
            timeOut = setTimeout(resolve, ms)
        })
    }

    /**
     * Notify user.
     * @param title string
     * @param options any
     */
    const showNotification = (title: string, options: any) => {
        const _t = title === '' ? packageJson.productName : title
        new window.Notification(_t, options)
    }

    // #endregion

    // region popin
    /**
     * Necessary display waiting popin.
     * @param block boolean
     */
    const blockScrolling = (block = true) => {
        const body = document.getElementsByTagName(
            `body`
        )[0] as unknown as HTMLBodyElement
        body.style.overflowY = block ? 'hidden' : 'auto'
    }

    useEffect(() => {
        window.interactionAPI.displaySplashScreen((visibility = true) => {
            blockScrolling(visibility)
        })
    }, [])

    /**
     * Show/Hide waiting popin during process.
     * @param value string | boolean
     */
    const showHidePopinDuringProcess = async (value: string | boolean) => {
        if (typeof value === 'string') {
            setPopinText(value)
            setDisplayPopin(true)
            blockScrolling(true)
            window.scrollTo(0, 0)
        } else if (value === true) {
            setPopinText(`Done 🎉`)
            await _sleep(2000)
            setDisplayPopin(false)
            blockScrolling(false)
        } else {
            setPopinText(`Error 🚫`)
            await _sleep(4000)
            setDisplayPopin(false)
            blockScrolling(false)
        }
    }

    // #endregion

    // #region handlers
    /**
     * Handler, launch simple mesure with the plugin.
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
        setDisplayReloadButton(false)
        showHidePopinDuringProcess(
            `${t('Url(s) Measure (Simple mode)')} started 🚀`
        )
        try {
            await window.electronAPI.handleSimpleMesures(urlsList)
            showHidePopinDuringProcess(true)
        } catch (error) {
            frontLog.error('Error on runSimpleMesures', error)
            showNotification('', {
                body: t('Error on runSimpleMesures'),
                subtitle: t('Courses Measure (Simple mode)'),
            })
            showHidePopinDuringProcess(false)
        }
    }

    /**
     * Handler, Read and Reload the Json configuration for mesures of parcours. Relaunched when workDir change.
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
    }, [])

    /**
     * Handler, launch measures of parcours.
     * 1. Save Json configuration in workDir.
     * 2. Launch measures with the plugin.
     * @param saveAndCollect boolean
     * @returns Promise<void>
     */
    const runJsonSaveAndCollect = async (saveAndCollect = false) => {
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
        setDisplayReloadButton(false)
        showHidePopinDuringProcess(
            `${t('Courses Measure (Full mode)')} started 🚀`
        )
        try {
            frontLog.debug(`jsonDatas`, jsonDatas)
            frontLog.debug(`saveAndCollect`, saveAndCollect)
            await window.electronAPI.handleJsonSaveAndCollect(
                jsonDatas,
                saveAndCollect
            )
            showHidePopinDuringProcess(true)
        } catch (error) {
            frontLog.error('Error on runJsonSaveAndCollect', error)
            showNotification('', {
                subtitle: t('🚫 Courses Measure (Full mode)'),
                body: t('Error on runJsonSaveAndCollect'),
            })
            showHidePopinDuringProcess(false)
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
     * Handler to copy in clipboard the content of datasFromHost.
     */
    const copyToClipBoard = () => {
        navigator.clipboard.writeText(JSON.stringify(datasFromHost, null, 2))
    }

    /**
     * Handlers, force window refresh
     */
    const forceRefresh = () => {
        // getMainWindow().webContents.reload()
        window.location.reload()
    }

    // #endregion

    // #region initialisationAPI
    /**
     * Init and Reset Reload Button.
     * @param clear Reset counter
     */
    const initReloadButton = async (clear = false) => {
        const waitSeconds = 90
        setDisplayReloadButton(false)
        await _sleep(waitSeconds * 1000, clear)
        setDisplayReloadButton(true)
    }

    /**
     * Launch Initialization.
     * @param forceInitialisation
     */
    const launchInitialization = async (forceInitialisation: boolean) => {
        frontLog.debug(`initializeApplication start 🚀`)
        // setDisplayPopin(true)
        // setDisplayInformationPopin(true)
        // setInitializing(true)
        // setDisplayReloadButton(false)
        // initReloadButton()
        if (
            forceInitialisation ||
            (await window.store.get(storeConstants.APP_INSTALLED_ONCE, false))
        )
            setIsFirstStart(false)
        const result =
            await window.initialisationAPI.initializeApplication(
                forceInitialisation
            )
        // setInitializing(false)
        frontLog.debug(
            `initializeApplication ended with ${result ? 'OK 👍' : 'KO 🚫'} status.`
        )
    }

    // #endregion

    // #region useEffect

    /**
     * Detect window opening.
     */
    useEffect(() => {
        /**
         * Handler (main->front), get LinuxUpdate from main
         */
        window.electronAPI.handleNewLinuxVersion((linuxUpdate: LinuxUpdate) => {
            frontLog.debug(`linuxUpdate`, linuxUpdate)
            const resp = window.confirm(
                t(
                    `A new version of the app is avalaible ({{version}}), do you want to download it?`,
                    { version: linuxUpdate.latestReleaseVersion }
                )
            )
            if (resp === true) {
                window.open(linuxUpdate.latestReleaseURL, `_blank`)
            }
        })
        /**
         * Handler (main->front), get data from main
         */
        window.electronAPI.sendDatasToFront((data: any) => {
            if (typeof data === 'string') {
                const _data = JSON.parse(data)
                // frontLog.debug(`sendDatasToFront`, _data)
                frontLog.debug(`sendDatasToFront is a string`, _data)
                setDatasFromHost((oldObject) => ({
                    ...oldObject,
                    ..._data,
                }))
            } else {
                if (data.type && (data.result || data.error)) {
                    // frontLog.debug(`sendDatasToFront is a ConfigData`, data)
                    setDatasFromHost((oldObject) => {
                        const o: any = {
                            ...oldObject,
                        }
                        const type = (data as ConfigData).type
                        o[type] = data
                        return o
                    })
                } else {
                    // frontLog.debug(`sendDatasToFront`, JSON.stringify(data, null, 2))
                    frontLog.debug(
                        `sendDatasToFront is object`,
                        JSON.stringify(data, null, 2)
                    )
                    setDatasFromHost((oldObject) => ({
                        ...oldObject,
                        ...data,
                    }))
                }
            }
        })

        /**
         * Handler (main->front), Change language from Menu.
         */
        window.electronAPI.changeLanguageInFront((lng: string) => {
            try {
                i18nResources.changeLanguage(lng, (err, t) => {
                    if (err)
                        return frontLog.error(
                            'something went wrong loading',
                            err
                        )
                    t('key') // -> same as i18next.t
                })
            } catch (error) {
                frontLog.error(error)
            }
        })

        /**
         * Read language set in Store.
         */
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
        /**
         * On Window opening, Launch read language in Store.
         */
        getLanguage()
        /**
         * On Window opening, Launch intialization.
         */
        launchInitialization(false)

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
                    setInformationPopinErrorLink(message?.errorLink)
                }

                if (message.modalType === 'started') {
                    setDisplayInformationPopin(true)
                } else if (message.modalType === 'completed') {
                    await _sleep(2000)
                    setDisplayInformationPopin(false)
                } else if (message.modalType === 'error') {
                    setDisplayInformationPopin(true)
                    setShowInformationSpinner(false)
                    setInformationPopinIsAlert(true)
                }
            }
        )
    }, [])

    /**
     * Detect workDir change.
     */
    useEffect(() => {
        const isJsonConfigFileExist = async () => {
            const lastWorkDir = await window.store.get(`lastWorkDir`, workDir)
            const result =
                await window.electronAPI.handleIsJsonConfigFileExist(
                    lastWorkDir
                )
            frontLog.log(`isJsonConfigFileExist`, result)

            result && runJsonReadAndReload()
        }
        isJsonConfigFileExist()
    }, [workDir, runJsonReadAndReload])

    // #endregion

    // #region JSX

    return (
        <>
            <div className="container relative">
                <DarkModeSwitcher
                    title={t('Dark mode switch')}
                    className="absolute left-2 top-2 z-20 flex gap-2"
                />
                <SimpleTooltip
                    tooltipContent={
                        <p>
                            {t(
                                'Copy application informations to clipboard.<br />Send theim to developper at renaud@greenit.fr.'
                            )}
                        </p>
                    }
                >
                    <Button
                        variant="secondary"
                        size="sm"
                        className="absolute right-2 top-2 z-20"
                        onClick={copyToClipBoard}
                    >
                        <Bug className="mr-2 size-4" />
                        {t('Debug')}
                    </Button>
                </SimpleTooltip>
                <main className="flex h-screen flex-col justify-between gap-4 p-4">
                    <div className="flex flex-col items-center gap-4">
                        <Header />
                        <InitErrorAlerts
                            datasFromHost={datasFromHost}
                            launchInitialization={launchInitialization}
                        />
                        {!appReady && <MySkeleton />}
                        {appReady && (
                            <>
                                <Card className="w-full border-primary">
                                    <CardHeader>
                                        <CardTitle>
                                            {t('1. Select ouput folder')}
                                        </CardTitle>
                                        <CardDescription>
                                            {t(
                                                'Specify where to execute the measures.'
                                            )}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex w-full items-center gap-2">
                                            <Input
                                                id="filePath"
                                                value={workDir}
                                                type="text"
                                                readOnly
                                            />
                                            <Button
                                                type="button"
                                                id="btn-file"
                                                disabled={!appReady}
                                                onClick={selectWorkingFolder}
                                            >
                                                {t('Browse')}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                                <TypographyP className={`w-full`}>
                                    {t(
                                        'Choose the type of measure you want to do.'
                                    )}
                                </TypographyP>
                                <Tabs
                                    defaultValue="simple-mesure"
                                    className="w-full"
                                >
                                    <TabsList className="mb-4 grid w-full grid-cols-2">
                                        <TabsTrigger value="simple-mesure">
                                            {t('Url(s) Measure (Simple mode)')}
                                        </TabsTrigger>
                                        <TabsTrigger value="json-mesure">
                                            {t('Courses Measure (Full mode)')}
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="simple-mesure">
                                        <SimplePanMesure
                                            appReady={appReady}
                                            language={i18nResources.language}
                                            simpleMesures={runSimpleMesures}
                                            urlsList={urlsList}
                                            setUrlsList={setUrlsList}
                                            className="border-primary"
                                        />
                                    </TabsContent>
                                    <TabsContent value="json-mesure">
                                        <JsonPanMesure
                                            appReady={appReady}
                                            isJsonFromDisk={isJsonFromDisk}
                                            language={i18nResources.language}
                                            jsonDatas={jsonDatas}
                                            setJsonDatas={setJsonDatas}
                                            mesure={() =>
                                                runJsonSaveAndCollect(true)
                                            }
                                            reload={runJsonReadAndReload}
                                            save={runJsonSaveAndCollect}
                                            notify={handlerJsonNotify}
                                            className="border-primary"
                                        />
                                    </TabsContent>
                                </Tabs>
                            </>
                        )}
                        {/* display here the echoReadable line */}
                        <ConsoleApp
                            id="echo"
                            datasFromHost={datasFromHost}
                            appReady={appReady}
                            isFirstStart={isFirstStart}
                            isPuppeteerBrowserInstalled={
                                isPuppeteerBrowserInstalled
                            }
                            workDir={workDir}
                            homeDir={homeDir}
                            puppeteerBrowserInstalledVersion={
                                puppeteerBrowserInstalledVersion
                            }
                        />
                    </div>
                    <Footer
                        appVersion={packageJson.version}
                        repoUrl={packageJson.homepage}
                    />
                </main>
            </div>
            <InformationPopin
                id="informationPopin"
                display={displayInformationPopin}
                title={informationPopinTitle}
                showSpinner={showInformationSpinner}
                isAlert={informationPopinIsAlert}
                errorLink={informationPopinErrorLink}
            >
                <span
                    className={cn(
                        'text-sm',
                        !informationPopinIsAlert
                            ? 'italic'
                            : 'font-bold !text-red-500'
                    )}
                >
                    {informationPopinMessage}
                </span>
                {informationPopinErrorLink &&
                    informationPopinErrorLink.label !== '' && (
                        <a
                            className="underline"
                            target="_blank"
                            href={informationPopinErrorLink.url}
                        >
                            {informationPopinErrorLink.label}
                        </a>
                    )}
            </InformationPopin>
            {displayPopin && (
                <PopinLoading
                    id="loadingPopin"
                    progress={progress}
                    showProgress={!appReady}
                    className="flex !flex-col items-center"
                    footer={
                        displayReloadButton && (
                            <Button
                                id="bt-reload"
                                variant="destructive"
                                size="sm"
                                onClick={forceRefresh}
                                className="max-w-fit"
                            >
                                {t('Reload if too long')}
                            </Button>
                        )
                    }
                >
                    <div className="flex flex-nowrap items-center">
                        <ReloadIcon className="mr-2 size-4 animate-spin" />
                        <p id="counter">{popinText}</p>
                    </div>
                </PopinLoading>
            )}
            <SplashScreen
                id="splash-screen"
                language={i18nResources.language}
                onClose={() => blockScrolling(false)}
            />
        </>
    )
}

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<TheApp />} />
            </Routes>
        </Router>
    )
}
