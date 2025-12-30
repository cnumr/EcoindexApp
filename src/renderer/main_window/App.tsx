import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/renderer/components/ui/card'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/renderer/components/ui/tabs'
import { useEffect, useRef } from 'react'

import { Button } from '@/renderer/components/ui/button'
import { ConsoleApp } from '@/renderer/components/ConsoleApp'
import { DarkModeSwitcher } from '@/renderer/components/DarkModeSwitcher'
import { Footer } from '@/renderer/components/Footer'
import { Header } from '@/renderer/components/Header'
import { InformationPopin } from '@/renderer/components/InformationPopin'
import { InitErrorAlerts } from '@/renderer/components/InitErrorAlerts'
import { Input } from '@/renderer/components/ui/input'
import { JsonPanMesure } from '@/renderer/components/JsonPanMesure'
import { LanguageSwitcher } from '@/renderer/components/LanguageSwitcher'
import { MySkeleton } from '@/renderer/components/MySkeleton'
import { PopinLoading } from '@/renderer/components/PopinLoading'
import { Textarea } from '@/renderer/components/ui/textarea'
import { SimplePanMesure } from '@/renderer/components/SimplePanMesure'
import { SplashScreen } from '@/renderer/components/SplashScreen'
import { TypographyP } from '@/renderer/components/ui/typography/TypographyP'
import { cn } from '@/renderer/lib/utils'
import i18nResources from '@/configs/i18nResources'
import packageJson from '../../../package.json'
import { useAppState } from './hooks/useAppState'
import { useAppUtils } from './hooks/useAppUtils'
import { useAppHandlers } from './hooks/useAppHandlers'
import { useIpcListeners } from './hooks/useIpcListeners'
import { useWorkDirEffect } from './hooks/useWorkDirEffect'

function TheApp() {
    // États et traduction
    const state = useAppState()
    const {
        t,
        workDir,
        homeDir,
        appReady,
        datasFromHost,
        displayPopin,
        popinText,
        isFirstStart,
        isPuppeteerBrowserInstalled,
        puppeteerBrowserInstalledVersion,
        displayInformationPopin,
        informationPopinTitle,
        informationPopinErrorLink,
        informationPopinMessage,
        informationPopinIsAlert,
        showInformationSpinner,
        envVars,
        consoleMessages,
        consoleMessagesSnapshot,
        setConsoleMessagesSnapshot,
        urlsList,
        jsonDatas,
        localAdvConfig,
        setUrlsList,
        setJsonDatas,
        setEnvVars,
        setLocalAdvConfig,
        setPopinText,
        setDisplayPopin,
        setIsJsonFromDisk,
        setIsFirstStart,
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
        tRef,
    } = state

    // Utilitaires
    const {
        sleep,
        showNotification,
        blockScrolling,
        showHidePopinDuringProcess,
    } = useAppUtils()

    // Handlers
    const {
        runSimpleMesures,
        runJsonReadAndReload,
        runJsonSaveAndCollect,
        handlerJsonNotify,
        selectWorkingFolder,
        launchInitialization,
    } = useAppHandlers({
        workDir,
        homeDir,
        urlsList,
        localAdvConfig,
        envVars,
        jsonDatas,
        t,
        setWorkDir,
        setJsonDatas,
        setIsJsonFromDisk,
        setIsFirstStart,
        consoleMessages,
        setConsoleMessagesSnapshot,
        showHidePopinDuringProcess: (value: string | boolean) =>
            showHidePopinDuringProcess(value, setPopinText, setDisplayPopin),
        showNotification,
        setPopinText,
        setDisplayPopin,
    })

    // Calculer les messages depuis le début de la mesure
    const measureConsoleMessages = (() => {
        if (!consoleMessagesSnapshot || !consoleMessagesSnapshot.trim()) {
            return consoleMessages.trim()
        }

        if (!consoleMessages || !consoleMessages.trim()) {
            return ''
        }

        // Vérifier si consoleMessages commence par le snapshot
        if (consoleMessages.startsWith(consoleMessagesSnapshot)) {
            const newMessages = consoleMessages.slice(
                consoleMessagesSnapshot.length
            )
            return newMessages.replace(/^\n+/, '').trim()
        }

        // Si le snapshot n'est pas au début, chercher son index
        const snapshotIndex = consoleMessages.indexOf(consoleMessagesSnapshot)

        if (snapshotIndex === -1) {
            // Le snapshot n'est pas trouvé, prendre tous les messages
            return consoleMessages.trim()
        }

        // Prendre seulement ce qui vient après le snapshot
        const newMessages = consoleMessages.slice(
            snapshotIndex + consoleMessagesSnapshot.length
        )
        return newMessages.replace(/^\n+/, '').trim()
    })()

    // Listeners IPC
    useIpcListeners({
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
    })

    // Effet pour workDir
    useWorkDirEffect({
        workDir,
        runJsonReadAndReload,
    })

    // Effet pour le splash screen
    useEffect(() => {
        window.electronAPI.displaySplashScreen((visibility = true) => {
            blockScrolling(visibility)
        })
    }, [blockScrolling])

    // Ref pour le Textarea de la popin (pour auto-scroll)
    const popinTextareaRef = useRef<HTMLTextAreaElement>(null)

    // Auto-scroll vers le bas quand de nouveaux messages arrivent dans la popin
    useEffect(() => {
        if (popinTextareaRef.current && displayPopin) {
            const textarea = popinTextareaRef.current
            textarea.scrollTop = textarea.scrollHeight
        }
    }, [measureConsoleMessages, displayPopin])

    return (
        <>
            <div className="container relative">
                <DarkModeSwitcher
                    title={t('Dark mode switch')}
                    className="absolute left-2 top-2 z-20 flex gap-2"
                />
                <div className="absolute right-2 top-2 z-20">
                    <LanguageSwitcher />
                </div>
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
                                            mesure={runSimpleMesures}
                                            urlsList={urlsList}
                                            setUrlsList={setUrlsList}
                                            className="border-primary"
                                            envVars={envVars}
                                            setEnvVars={setEnvVars}
                                            localAdvConfig={localAdvConfig}
                                            setLocalAdvConfig={
                                                setLocalAdvConfig
                                            }
                                        />
                                    </TabsContent>
                                    <TabsContent value="json-mesure">
                                        <JsonPanMesure
                                            appReady={appReady}
                                            isJsonFromDisk={
                                                state.isJsonFromDisk
                                            }
                                            language={i18nResources.language}
                                            jsonDatas={jsonDatas}
                                            setJsonDatas={setJsonDatas}
                                            mesure={(envVars) =>
                                                runJsonSaveAndCollect(
                                                    true,
                                                    envVars
                                                )
                                            }
                                            reload={runJsonReadAndReload}
                                            save={runJsonSaveAndCollect}
                                            notify={handlerJsonNotify}
                                            className="border-primary"
                                            envVars={envVars}
                                            setEnvVars={setEnvVars}
                                        />
                                    </TabsContent>
                                </Tabs>
                            </>
                        )}
                        <ConsoleApp
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
                            consoleMessages={consoleMessages}
                        />
                    </div>
                    <Footer
                        appVersion={packageJson?.version}
                        repoUrl={packageJson?.homepage}
                        coursesVersion={
                            (
                                packageJson?.dependencies as Record<
                                    string,
                                    string
                                >
                            )?.['lighthouse-plugin-ecoindex-courses'] ||
                            'undefined'
                        }
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
                            rel="noreferrer"
                            href={informationPopinErrorLink.url}
                        >
                            {informationPopinErrorLink.label}
                        </a>
                    )}
            </InformationPopin>
            {displayPopin && (
                <PopinLoading
                    id="loadingPopin"
                    className="flex !flex-col items-center"
                    footer={
                        <div className="mt-4 w-full max-w-2xl">
                            <Textarea
                                ref={popinTextareaRef}
                                className="h-32 w-full font-mono text-xs text-muted-foreground"
                                readOnly
                                value={measureConsoleMessages || ''}
                            />
                        </div>
                    }
                >
                    <TypographyP className="text-center">
                        {popinText}
                    </TypographyP>
                </PopinLoading>
            )}
            <SplashScreen
                id="splash-screen"
                onClose={() => blockScrolling(false)}
            />
        </>
    )
}

export default function App() {
    return <TheApp />
}
