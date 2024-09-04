import { ChangeEvent, useEffect, useState } from 'react'
import { Route, MemoryRouter as Router, Routes } from 'react-router-dom'

import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { CheckedState } from '@radix-ui/react-checkbox'
import { DarkModeSwitcher } from '../components/dark-mode-switcher'
import { Header } from '../components/Header'
import { MarkdownReader } from '../components/markdown-reader'
import { convertVersion } from '../../main/utils'
import i18nResources from '../../configs/i18nResources'
import log from 'electron-log/renderer'
import mdContentEN from '../../extraResources/md/splash-content.en.md'
import mdContentFR from '../../extraResources/md/splash-content.fr.md'
import pkg from '../../../package.json'
import { useTranslation } from 'react-i18next'

const frontLog = log.scope('front/HelloApp')

function HelloApp() {
    // #region useState, useTranslation
    const [language, setLanguage] = useState('en')
    const [checked, setChecked] = useState(false)
    const { t } = useTranslation()
    // endregion

    // region handlers
    const closeHandler = () => {
        // window.electronAPI.hideHelloWindow()
        // window.scrollTo(0, 0)
        window.close()
    }

    const handlerDoNotDisplayAgain = (event: CheckedState) => {
        setChecked(event.valueOf() as boolean)
        window.store.set(
            `displayHello.${convertVersion(pkg.version)}`,
            event.valueOf()
        )
    }
    // endregion

    // #region useEffect
    useEffect(() => {
        /**
         * Handler (main->front), Change language from Menu.
         */
        window.electronAPI.changeLanguageInFront((lng: string) => {
            frontLog.debug(`changeLanguageInFront`, lng)
            setLanguage(lng)
            try {
                i18nResources.changeLanguage(lng, (err, t) => {
                    if (err)
                        // silent error
                        return frontLog.log('something went wrong loading', err)
                    t('key') // -> same as i18next.t
                })
            } catch (error) {
                frontLog.error(error)
            }
        })

        const getLanguage = async () => {
            const gettedLng = await window.store.get(`language`, `fr`)
            if (gettedLng) {
                i18nResources.changeLanguage(gettedLng)
                setLanguage(gettedLng)
            }
        }
        getLanguage()

        const updateCheckBox = async () => {
            const displayHello = `displayHello.${convertVersion(pkg.version)}`
            const value = (await window.store.get(
                displayHello
            )) as unknown as boolean
            setChecked(value)
        }
        updateCheckBox()
    }, [])
    // #endregion

    // region JSX
    return (
        <div className="relative flex flex-col items-center justify-center gap-4 p-8">
            <DarkModeSwitcher visible={false} />
            <Header />
            <div className="prose mx-auto !max-w-max dark:prose-invert prose-headings:underline">
                {language === 'en' ? (
                    <MarkdownReader file={mdContentEN} />
                ) : (
                    <MarkdownReader file={mdContentFR} />
                )}
            </div>
            <div className="mt-8 flex w-full items-center justify-between">
                <div className="flex w-1/3 items-start space-x-2 *:justify-start">
                    <Checkbox
                        id="do-not-display-again"
                        checked={checked}
                        onCheckedChange={(event) =>
                            handlerDoNotDisplayAgain(event)
                        }
                    />
                    <div className="grid gap-1.5 leading-none">
                        <label
                            htmlFor="do-not-display-again"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {t(`Do not show this window again.`)}
                        </label>
                        <p className="text-sm text-muted-foreground">
                            {t(
                                `Don't worry, you can always open it from the Help menu.`
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex w-1/3 !justify-center">
                    <Button
                        onClick={closeHandler}
                        id="close-window"
                        size="default"
                        variant="default"
                        className="w-fit"
                        title={t('Close this window')}
                    >
                        {t('Close')}
                    </Button>
                </div>
                <div className="w-1/3"></div>
            </div>
            <div className="prose prose-sm text-center font-semibold dark:prose-invert">
                {t('Version of the application')}: {pkg.version}
            </div>
        </div>
    )
}

export default function Hello() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HelloApp />} />
            </Routes>
        </Router>
    )
}
