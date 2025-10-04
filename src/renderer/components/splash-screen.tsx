import { useEffect, useState } from 'react'

import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { CheckedState } from '@radix-ui/react-checkbox'
import { MarkdownReader } from './markdown-reader'
import { cn } from '../lib/utils'
import { convertVersion } from '../../main/utils'
import mdContentEN from '../../extraResources/md/splash-content.en.md'
import mdContentFR from '../../extraResources/md/splash-content.fr.md'
import pkg from '../../../package.json'
import { useTranslation } from 'react-i18next'

export const SplashScreen = ({
    language,
    id,
    onClose,
}: {
    language: string
    id?: string
    onClose?: () => void
}) => {
    const [visible, setVisible] = useState(false)
    const [checked, setChecked] = useState(false)
    const { t } = useTranslation()

    useEffect(() => {
        window.interactionAPI.displaySplashScreen((visibility = true) => {
            setVisible(visibility)
        })
    }, [])
    const handlerDoNotDisplayAgain = (event: CheckedState) => {
        setChecked(event.valueOf() as boolean)
        window.store.set(
            `displayHello.${convertVersion(pkg.version)}`,
            event.valueOf()
        )
    }
    const closeHandler = () => {
        setVisible(false)
        onClose?.()
    }
    return (
        <div
            id={id ?? 'splash-screen'}
            className={cn(
                'max-w-screen absolute left-0 top-0 z-20 h-screen max-h-screen w-screen',
                visible ? 'inline-block' : 'hidden'
            )}
        >
            <div className="max-w-screen absolute h-full max-h-screen w-full bg-background opacity-70"></div>
            <div className="max-w-screen absolute grid h-full max-h-screen w-full place-content-center">
                <div className="relative m-16 flex flex-col items-center gap-2 overflow-y-auto rounded-md border border-primary bg-background px-4 py-3 shadow-lg shadow-primary/50">
                    <div className="mb-4 w-full">
                        <h1>
                            {t('splash.hello')} v{pkg.version}
                        </h1>
                    </div>
                    <div
                        className={cn(
                            'prose mx-auto !max-w-max dark:prose-invert prose-headings:underline',
                            visible ? 'inline-block' : 'invisible'
                        )}
                    >
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
            </div>
        </div>
    )
}
