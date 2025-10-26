import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../ui/card'

import { AdvConfiguration } from './adv-configuration'
import { Button } from '../ui/button'
import { FC } from 'react'
import { SimpleUrlsList } from './simple-urls'
import { useTranslation } from 'react-i18next'

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
                <form id="simple-form">
                    <AdvConfiguration
                        statementVisible={false}
                        configurationDatas={localAdvConfig}
                        setConfigurationDatas={(e: IAdvancedMesureData) => {
                            const _jsonDatas = {
                                ...localAdvConfig,
                                'extra-header': e['extra-header'],
                                output: e['output'],
                                'audit-category': e['audit-category'],
                            }
                            if (e['audit-category']) {
                                _jsonDatas['puppeteer-script'] =
                                    e['puppeteer-script']
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
