import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from './ui/card'
import React from 'react'

import { AdvConfiguration } from './AdvConfiguration'
import { Button } from './ui/button'
import { FC } from 'react'
import { SimpleUrlsList } from './SimpleUrlsList'
import { useTranslation } from 'react-i18next'
import type {
    ISimpleUrlInput,
    IKeyValue,
    IAdvancedMesureData,
} from '@/interface'

export interface ISimpleMesureLayout {
    appReady: boolean
    language: string
    mesure: () => void
    urlsList: ISimpleUrlInput[]
    setUrlsList: (urlsList: ISimpleUrlInput[]) => void
    className: string
    envVars: IKeyValue
    setEnvVars: (value: IKeyValue) => void
    localAdvConfig: IAdvancedMesureData
    setLocalAdvConfig: (value: IAdvancedMesureData) => void
}

export const SimplePanMesure: FC<ISimpleMesureLayout> = ({
    appReady,
    language,
    mesure,
    urlsList,
    setUrlsList,
    className,
    envVars,
    setEnvVars,
    localAdvConfig,
    setLocalAdvConfig,
}) => {
    const { t } = useTranslation()
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{t('2. Urls to measure')}</CardTitle>
                <CardDescription>
                    {t('Simples measures with HTML output.')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    id="simple-form"
                    onSubmit={(e) => {
                        // Empêcher la soumission du formulaire par défaut
                        // pour permettre les retours à la ligne dans les textareas
                        e.preventDefault()
                    }}
                >
                    <AdvConfiguration
                        statementVisible={false}
                        configurationDatas={localAdvConfig}
                        setConfigurationDatas={(
                            e:
                                | IAdvancedMesureData
                                | React.SetStateAction<IAdvancedMesureData>
                        ) => {
                            const config =
                                typeof e === 'function' ? e(localAdvConfig) : e
                            const _jsonDatas = {
                                ...localAdvConfig,
                                'extra-header': config['extra-header'],
                                output: config['output'],
                                'audit-category': config['audit-category'],
                            }
                            if (config['audit-category']) {
                                _jsonDatas['puppeteer-script'] =
                                    config['puppeteer-script']
                            } else {
                                if (_jsonDatas['puppeteer-script']) {
                                    delete _jsonDatas['puppeteer-script']
                                }
                            }
                            setLocalAdvConfig(_jsonDatas)
                        }}
                        envVars={envVars}
                        setEnvVars={(ev) => {
                            setEnvVars(ev)
                        }}
                    />
                    <fieldset>
                        <legend>
                            <span>{t('simple-mesure.urls.title')}</span>
                        </legend>

                        <SimpleUrlsList
                            urlsList={urlsList}
                            setUrlsList={setUrlsList}
                            visible={true}
                            language={language}
                            title=""
                            enableTextMode={true}
                            placeholder="https://www.example.com/&#10;https://www.example2.com/"
                            textModeFormat={t('simpleUrlsList.textModeFormat')}
                        />
                    </fieldset>
                </form>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
                <CardTitle>{t('3. Launch the measures')}</CardTitle>
                <CardDescription>
                    {t('Generates Html reports in seleted dir.')}
                </CardDescription>
                <Button
                    type="button"
                    id="btn-simple-mesures"
                    title={t('Launch the measures')}
                    disabled={!appReady}
                    onClick={mesure}
                    className="btn btn-green"
                >
                    {t('Measures')}
                </Button>
            </CardFooter>
        </Card>
    )
}
