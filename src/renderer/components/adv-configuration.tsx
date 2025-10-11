import { ChangeEvent, FC, useEffect, useState } from 'react'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { KeyValue } from './key-value'
import { Switch } from '../ui/switch'
import log from 'electron-log/renderer'
import { useTranslation } from 'react-i18next'

const frontLog = log.scope('front/AdvConfiguration')

export interface ILayout {
    configurationDatas: IAdvancedMesureData
    setConfigurationDatas?: (
        value: React.SetStateAction<IAdvancedMesureData>
    ) => void
    setUpdated?: (value: boolean) => void
    isOpen?: boolean
}

export const AdvConfiguration: FC<ILayout> = ({
    configurationDatas,
    setConfigurationDatas,
    setUpdated,
    isOpen = false,
}) => {
    const { t } = useTranslation()

    const [enableStatement, setEnableStatement] = useState(false)

    useEffect(() => {
        setEnableStatement(!configurationDatas['output'].includes('json'))
    }, [])

    const jsonMandatoryWithStatement = (e: boolean) => {
        frontLog.debug('json', e)
        frontLog.debug('json', e)
        const output = configurationDatas?.output
        if (e) {
            output.push('json')
        } else {
            if (output.includes('json')) {
                const json = output.indexOf('json')
                output.splice(json, 1)
            }
            if (output.includes('statement')) {
                const statement = output.indexOf('statement')
                output.splice(statement, 1)
            }
        }
        const _configurationDatas = {
            ...configurationDatas,
            output: output,
        }
        setConfigurationDatas(_configurationDatas)
        setEnableStatement(!e)
        setUpdated(true)
    }

    const handleSelectPuppeteerFilePath = async () => {
        const filePath =
            await window.electronAPI.handleSelectPuppeteerFilePath()

        if (filePath !== undefined) {
            frontLog.debug(`set Puppeteer File Path to ${filePath}`)
            const _configurationDatas = {
                ...configurationDatas,
                'puppeteer-script': filePath,
            }
            setConfigurationDatas(_configurationDatas)
            setUpdated(true)
        }
    }

    const resetPuppeteerFilePath = () => {
        frontLog.debug(`reset Puppeteer File Path`)
        const _configurationDatas = {
            ...configurationDatas,
        }
        delete _configurationDatas?.['puppeteer-script']
        setConfigurationDatas(_configurationDatas)
        setUpdated(true)
    }

    const handleSelectPuppeteerFilePath = async () => {
        const filePath =
            await window.electronAPI.handleSelectPuppeteerFilePath()

        if (filePath !== undefined) {
            frontLog.debug(`set Puppeteer File Path to ${filePath}`)
            const _configurationDatas = {
                ...configurationDatas,
                'puppeteer-script': filePath,
            }
            setConfigurationDatas(_configurationDatas)
            setUpdated(true)
        }
    }

    const resetPuppeteerFilePath = () => {
        frontLog.debug(`reset Puppeteer File Path`)
        const _configurationDatas = {
            ...configurationDatas,
        }
        delete _configurationDatas?.['puppeteer-script']
        setConfigurationDatas(_configurationDatas)
        setUpdated(true)
    }

    const handlerOnChange = (
        course: number,
        e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement> | boolean,
        id?: string,
        name?: string
    ) => {
        const updateGeneric = (
            type: string,
            id: string,
            name: string,
            value: string | boolean,
            _c: number
        ) => {
            frontLog.debug('updateGeneric', type, id, name, value, _c)

            if (name === 'output') {
                frontLog.debug(`is output`)
                if (e) {
                    const _configurationDatas = {
                        ...configurationDatas,
                    }
                    _configurationDatas['output'].push(id)
                    setConfigurationDatas?.(_configurationDatas)
                } else {
                    setConfigurationDatas?.({
                        ...configurationDatas,
                        output: configurationDatas['output'].filter(
                            (val) => val !== id
                        ),
                    })
                }
            } else if (name === 'audit-category') {
                frontLog.debug(`is audit-category`)
                if (e) {
                    const _configurationDatas = {
                        ...configurationDatas,
                    }
                    _configurationDatas['audit-category'].push(id)
                    setConfigurationDatas?.(_configurationDatas)
                } else {
                    setConfigurationDatas?.({
                        ...configurationDatas,
                        'audit-category': configurationDatas[
                            'audit-category'
                        ].filter((val) => val !== id),
                    })
                }
            } else {
                setConfigurationDatas?.({
                    ...configurationDatas,
                    [id]: value,
                })

            if (name === 'output') {
                frontLog.debug(`is output`)
                if (e) {
                    const _configurationDatas = {
                        ...configurationDatas,
                    }
                    _configurationDatas['output'].push(id)
                    setConfigurationDatas?.(_configurationDatas)
                } else {
                    setConfigurationDatas?.({
                        ...configurationDatas,
                        output: configurationDatas['output'].filter(
                            (val) => val !== id
                        ),
                    })
                }
            } else if (name === 'audit-category') {
                frontLog.debug(`is audit-category`)
                if (e) {
                    const _configurationDatas = {
                        ...configurationDatas,
                    }
                    _configurationDatas['audit-category'].push(id)
                    setConfigurationDatas?.(_configurationDatas)
                } else {
                    setConfigurationDatas?.({
                        ...configurationDatas,
                        'audit-category': configurationDatas[
                            'audit-category'
                        ].filter((val) => val !== id),
                    })
                }
            } else {
                setConfigurationDatas?.({
                    ...configurationDatas,
                    [id]: value,
                })
            }
        }
        if (typeof e !== 'boolean') {
            if (e.target.type === 'checkbox' && e.target.name === 'output') {
                const output = configurationDatas.output
                if ((e.target as HTMLInputElement).checked) {
                    output.push(e.target.id)
                } else {
                    const index = output.indexOf(e.target.id)
                    output.splice(index, 1)
                }
                setConfigurationDatas?.({
                    ...configurationDatas,
                    output: output,
                })
            } else {
                updateGeneric(
                    e.target.type,
                    e.target.id,
                    e.target.name,
                    e.target.type === 'checkbox'
                        ? (e.target as HTMLInputElement).checked
                        : e.target.value,
                    course
                )
            }
        } else {
            // todo
            frontLog.debug(`handlerOnChange`, id, name, e, course)

            updateGeneric('checkbox', id, name ? name : id, e, course)
        }

        // frontLog.debug(`configurationDatas`, configurationDatas)
        setUpdated(true)
    }

    return (
        <details open={isOpen}>
            <summary title={t('advConfiguration.title-title')}>
                {t('advConfiguration.title')}
            </summary>
            <fieldset>
                <legend>{t('Extra header')}</legend>
                <p>{t('Header to add cookies, Authentication...')} </p>
                <div>
                    <KeyValue
                        datas={
                            configurationDatas?.['extra-header'] as IKeyValue
                        }
                        visible={true}
                        isFullWidth={true}
                        title={t('Extra header')}
                        setDatas={(e: IKeyValue) => {
                            setConfigurationDatas({
                                ...configurationDatas,
                                'extra-header': e,
                            })
                            setUpdated(true)
                        }}
                    />
                </div>
            </fieldset>
            <fieldset>
                <legend className="mandatory">
                    {t('Choose the reports you want to generate')}
                </legend>
                <div className="!grid grid-cols-2 gap-2">
                    <div>
                        <Switch
                            id="html"
                            name="output"
                            checked={configurationDatas?.output.includes(
                                'html'
                            )}
                            onCheckedChange={(e) => {
                                handlerOnChange(-1, e, 'html', 'output')
                            }}
                        />
                        <label htmlFor="html">HTML</label>
                    </div>
                    <div>
                        <Switch
                            id="json"
                            name="output"
                            checked={configurationDatas?.output.includes(
                                'json'
                            )}
                            onCheckedChange={(e) => {
                                // handlerOnChange(-1, e, 'json', 'output')
                                jsonMandatoryWithStatement(e)
                            }}
                        />
                        <label htmlFor="json">JSON</label>
                    </div>
                    <div>
                        <Switch
                            id="statement"
                            name="output"
                            disabled={enableStatement}
                            checked={configurationDatas?.output.includes(
                                'statement'
                            )}
                            onCheckedChange={(e) => {
                                handlerOnChange(-1, e, 'statement', 'output')
                            }}
                        />
                        <label htmlFor="statement">
                            {t('Statement')}{' '}
                            <em className="text-xs">
                                {t('(JSON output mandatory)')}
                            </em>
                        </label>
                    </div>
                </div>
            </fieldset>
            <fieldset>
                <legend className="mandatory">
                    {t('common.audit.audit-category.title')}
                </legend>
                <div className="!grid grid-cols-2 gap-2">
                    <div>
                        <Switch
                            id="seo"
                            name="audit-category"
                            checked={configurationDatas?.[
                                'audit-category'
                            ].includes('seo')}
                            onCheckedChange={(e) => {
                                handlerOnChange(-1, e, 'seo', 'audit-category')
                            }}
                        />
                        <label htmlFor="seo">
                            {t('common.audit.audit-category.seo')}
                        </label>
                    </div>
                    <div>
                        <Switch
                            id="performance"
                            name="audit-category"
                            checked={configurationDatas?.[
                                'audit-category'
                            ].includes('performance')}
                            onCheckedChange={(e) => {
                                handlerOnChange(
                                    -1,
                                    e,
                                    'performance',
                                    'audit-category'
                                )
                            }}
                        />
                        <label htmlFor="performance">
                            {t('common.audit.audit-category.performance')}
                        </label>
                    </div>
                    <div>
                        <Switch
                            id="accessibility"
                            name="audit-category"
                            checked={configurationDatas?.[
                                'audit-category'
                            ].includes('accessibility')}
                            onCheckedChange={(e) => {
                                handlerOnChange(
                                    -1,
                                    e,
                                    'accessibility',
                                    'audit-category'
                                )
                            }}
                        />
                        <label htmlFor="accessibility">
                            {t('common.audit.audit-category.accessibility')}
                        </label>
                    </div>
                    <div>
                        <Switch
                            id="best-practices"
                            name="audit-category"
                            checked={configurationDatas?.[
                                'audit-category'
                            ].includes('best-practices')}
                            onCheckedChange={(e) => {
                                handlerOnChange(
                                    -1,
                                    e,
                                    'best-practices',
                                    'audit-category'
                                )
                            }}
                        />
                        <label htmlFor="best-practices">
                            {t('common.audit.audit-category.best-practices')}
                        </label>
                    </div>
                    <div>
                        <Switch
                            id="lighthouse-plugin-ecoindex-core"
                            name="audit-category"
                            checked={true}
                            disabled={true}
                        />
                        <label htmlFor="lighthouse-plugin-ecoindex-core">
                            {t(
                                'common.audit.audit-category.lighthouse-plugin-ecoindex-core'
                            )}{' '}
                            <em className="text-xs">
                                {t(
                                    'common.audit.audit-category.ecoindex-core.mandatory'
                                )}
                            </em>
                        </label>
                    </div>
                </div>
            </fieldset>
            <fieldset>
                <legend>{t('advConfiguration.puppeteer.title')}</legend>
                <p>{t('advConfiguration.puppeteer.description')}</p>
                <p>{t('advConfiguration.puppeteer.help-link')}</p>
                <div className="flex w-full items-center gap-2">
                    <Input
                        id="filePath"
                        value={configurationDatas?.['puppeteer-script'] || ''}
                        type="text"
                        readOnly
                        aria-label={t('advConfiguration.puppeteer.input.aria')}
                    />
                    <Button
                        type="button"
                        id="btn-file"
                        onClick={handleSelectPuppeteerFilePath}
                    >
                        {t('Browse')}
                    </Button>
                    <Button
                        type="button"
                        disabled={
                            configurationDatas?.['puppeteer-script'] === null ||
                            configurationDatas?.['puppeteer-script'] ===
                                undefined
                                ? true
                                : false
                        }
                        id="btn-file"
                        onClick={resetPuppeteerFilePath}
                    >
                        {t('Reset')}
                    </Button>
                </div>
            </fieldset>
            <fieldset>
                <legend>{t('advConfiguration.envvar.title')}</legend>
                <p>{t('advConfiguration.envvar.description')}</p>
            </fieldset>
        </details>
    )
}
