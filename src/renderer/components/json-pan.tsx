import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../ui/card'
import { ChangeEvent, FC, useState } from 'react'
import { CirclePlus, RotateCcw, Save, Trash2 } from 'lucide-react'

import { AdvConfiguration } from './adv-configuration'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { SimpleUrlsList } from './simple-urls'
import { Switch } from '../ui/switch'
import log from 'electron-log/renderer'
import { useTranslation } from 'react-i18next'

const frontLog = log.scope('front/JsonPan')

export interface ILayout {
    appReady: boolean
    isJsonFromDisk: boolean
    language: string
    setJsonDatas?: (jsonDatas: IJsonMesureData) => void
    jsonDatas?: IJsonMesureData
    className: string
    save: () => void
    reload: () => void
    mesure: (envVars: IKeyValue) => void
    notify: (subTitle: string, message: string) => void
    envVars: IKeyValue
    setEnvVars: (value: IKeyValue) => void
}

export const JsonPanMesure: FC<ILayout> = ({
    appReady,
    isJsonFromDisk,
    language,
    setJsonDatas,
    jsonDatas,
    className,
    save,
    reload,
    mesure,
    notify,
    envVars,
    setEnvVars,
}) => {
    const { t } = useTranslation()

    const [updated, setUpdated] = useState(false)

    /**
     * Gestionnaire d'ajout d'une course dans `jsonDatas`.
     */
    const handlerAddCourse = () => {
        frontLog.debug('add course')
        const newCourse = {
            name: 'TBD',
            target: 'TBD',
            course: 'TBD',
            'is-best-pages': false,
            urls: [{ value: 'https://www.ecoindex.fr/' }],
        }
        setJsonDatas?.({
            ...jsonDatas,
            courses: [...jsonDatas.courses, newCourse],
        })
        notify(t('Courses Measure (Full mode)'), t('Course added'))
        setUpdated(true)
    }

    /**
     * Gestionnaire de la suppression d'un course dans `jsonDatas`.
     * @param _ ?
     * @param key index de la course à supprimer
     */
    const handlerDeleteCourse = (_: any, key: number) => {
        frontLog.debug('delete course', key)
        setJsonDatas?.({
            ...jsonDatas,
            courses: jsonDatas.courses.filter((_, index) => index !== key),
        })
        notify(t('Courses Measure (Full mode)'), `Course ${key + 1} deleted`)
        setUpdated(true)
    }

    /**
     * Gestionnaire de la maj des listes d'url d'une course dans `jsonDatas`.
     * @param course course à maj
     * @param urlsList list des URL
     */
    const handlerOnUpdateSimpleUrlsList = (
        course: number,
        urlsList: ISimpleUrlInput[]
    ) => {
        frontLog.debug('handlerOnUpdateSimpleUrlsList', course, urlsList)
        setJsonDatas?.({
            ...jsonDatas,
            courses: jsonDatas.courses.map((c, index) => {
                if (index === course) {
                    return {
                        ...c,
                        urls: urlsList,
                    }
                }
                return c
            }),
        })
        setUpdated(true)
    }

    /**
     * Gestionnaire de mise à jour des données de `jsonDatas`.
     * **A SIMPLIFIER !**
     * @param course Données de course
     * @param e Event de maj
     * @param id ID de la source de maj
     * @param name Name de la source de maj (utile pour des checkboxs)
     */
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
            if (_c === -1) {
                if (name === 'output') {
                    frontLog.debug(`is output`)
                    if (e) {
                        const _jsonDatas = {
                            ...jsonDatas,
                        }
                        _jsonDatas['output'].push(id)
                        setJsonDatas?.(_jsonDatas)
                    } else {
                        setJsonDatas?.({
                            ...jsonDatas,
                            output: jsonDatas['output'].filter(
                                (val) => val !== id
                            ),
                        })
                    }
                } else if (name === 'audit-category') {
                    frontLog.debug(`is audit-category`)
                    if (e) {
                        const _jsonDatas = {
                            ...jsonDatas,
                        }
                        _jsonDatas['audit-category'].push(id)
                        setJsonDatas?.(_jsonDatas)
                    } else {
                        setJsonDatas?.({
                            ...jsonDatas,
                            'audit-category': jsonDatas[
                                'audit-category'
                            ].filter((val) => val !== id),
                        })
                    }
                } else {
                    setJsonDatas?.({
                        ...jsonDatas,
                        [id]: value,
                    })
                }
            } else {
                setJsonDatas?.({
                    ...jsonDatas,
                    courses: jsonDatas.courses.map((course, index) => {
                        if (index === _c) {
                            return {
                                ...course,
                                [id]: value,
                            }
                        }
                        return course
                    }),
                })
            }
        }
        if (typeof e !== 'boolean') {
            if (e.target.type === 'checkbox' && e.target.name === 'output') {
                const output = jsonDatas.output
                if ((e.target as HTMLInputElement).checked) {
                    output.push(e.target.id)
                } else {
                    const index = output.indexOf(e.target.id)
                    output.splice(index, 1)
                }
                setJsonDatas?.({
                    ...jsonDatas,
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

        // frontLog.debug(`jsonDatas`, jsonDatas)
        setUpdated(true)
    }

    /**
     * Déclanchement (first-step) du rechargement du fichier JSON.
     * @param event Event du bouton
     */
    const handlerOnReload = (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        // frontLog.debug('handlerOnReload', event.target)
        reload()
        setUpdated(false)
    }

    /**
     * Déclanchement (first-step) de la mesure.
     * @param event Event du boutons
     * @returns
     */
    const handlerOnSubmit = (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        // frontLog.debug('handlerOnSubmit', event.target)
        let count = 0
        jsonDatas?.courses.forEach((course) => {
            if (course['is-best-pages'] === true) count++
        })
        if (count === 0) {
            alert(t('You must set 1 best-page on courses.'))
            return
        } else if (count > 1) {
            alert(t('You must set only 1 best-page on courses.'))
            return
        }
        if (
            jsonDatas.output.includes(`statement`) &&
            !jsonDatas.output.includes(`json`)
        ) {
            alert(
                t(
                    'If you want to generate statement, you must select json too.'
                )
            )
            return
        }

        mesure(envVars)
        setUpdated(false)
    }

    /**
     * Déclanchement (first-step) de la sauvegarde du fichier JSON.
     * @param event Event du bouton
     */
    const handlerOnSave = (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        // frontLog.debug('handlerOnSave', event.target)
        const auditCategory: string[] = jsonDatas['audit-category']
        if (!auditCategory.includes('lighthouse-plugin-ecoindex-core')) {
            auditCategory.push('lighthouse-plugin-ecoindex-core')
        }
        setJsonDatas({
            ...jsonDatas,
            'audit-category': auditCategory,
        })
        save()
        setUpdated(false)
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{t('2. Configuration of the courses')}</CardTitle>
                <CardDescription>
                    {t(
                        'Measure courses and generate JSON file to relaunch measures.'
                    )}
                </CardDescription>
            </CardHeader>
            {/* <TypographyH2>2. Configuration of the courses</TypographyH2> */}
            <CardContent>
                <div className="mb-4 flex gap-2">
                    <Button
                        variant="secondary"
                        type="button"
                        size="sm"
                        id="btn-reload-json"
                        title={t('Reload the configuration')}
                        disabled={!appReady || !updated}
                        onClick={handlerOnReload}
                    >
                        <RotateCcw
                            className="mr-2 size-4"
                            aria-label={t('reload')}
                        />
                        <span>{t('Reload')}</span>
                    </Button>
                    <Button
                        variant="secondary"
                        type="button"
                        size="sm"
                        id="btn-save-json"
                        title={t('Save the configuration')}
                        disabled={!appReady || !updated}
                        onClick={handlerOnSave}
                    >
                        <Save className="mr-2 size-4" aria-label={t('save')} />
                        <span>{t('Save')}</span>
                    </Button>
                </div>
                <form id="json-form">
                    <AdvConfiguration
                        configurationDatas={jsonDatas}
                        setConfigurationDatas={(e: IAdvancedMesureData) => {
                            const _jsonDatas = {
                                ...jsonDatas,
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
                            setJsonDatas(_jsonDatas)
                        }}
                        setUpdated={(e) => {
                            setUpdated(e)
                        }}
                        envVars={envVars}
                        setEnvVars={(ev) => {
                            setEnvVars(ev)
                        }}
                    />

                    <fieldset>
                        <legend>
                            <span>{t('Courses')}</span>
                        </legend>
                        {jsonDatas?.courses.map((course, index) => {
                            const innerSetUrlsList = (
                                urlsList: ISimpleUrlInput[]
                            ) => {
                                handlerOnUpdateSimpleUrlsList(index, urlsList)
                            }
                            return (
                                <fieldset key={index}>
                                    <legend>
                                        <span>
                                            {t('Course')} {index + 1}
                                        </span>
                                        <Button
                                            variant="destructive"
                                            type="button"
                                            size="sm"
                                            id="btn-delete-course"
                                            title={t('Delete this course')}
                                            disabled={!appReady}
                                            className="btn btn-red btn-small"
                                            onClick={() =>
                                                handlerDeleteCourse(null, index)
                                            }
                                        >
                                            <Trash2
                                                className="size-4"
                                                aria-label={t('delete')}
                                            />
                                            <span className="sr-only">
                                                {t('Delete course')}
                                            </span>
                                        </Button>
                                    </legend>
                                    <div className="flex-col !items-start">
                                        <label
                                            htmlFor="name"
                                            className="mandatory"
                                        >
                                            {t('Course name')}
                                        </label>
                                        <Input
                                            type="text"
                                            name="name"
                                            id="name"
                                            value={course.name}
                                            onChange={(e) =>
                                                handlerOnChange(index, e)
                                            }
                                        />
                                    </div>
                                    <div className="flex-col !items-start">
                                        <label htmlFor="target" className="">
                                            {t('Target')}
                                        </label>
                                        <Input
                                            type="text"
                                            name="target"
                                            id="target"
                                            value={course.target}
                                            onChange={(e) =>
                                                handlerOnChange(index, e)
                                            }
                                        />
                                    </div>
                                    <div className="flex-col !items-start">
                                        <label htmlFor="course" className="">
                                            {t('Description')}
                                        </label>
                                        <Input
                                            type="text"
                                            name="course"
                                            id="course"
                                            value={course.course}
                                            onChange={(e) =>
                                                handlerOnChange(index, e)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Switch
                                            id="is-best-pages"
                                            name="is-best-pages"
                                            checked={course['is-best-pages']}
                                            onCheckedChange={(e) =>
                                                handlerOnChange(
                                                    index,
                                                    e,
                                                    'is-best-pages'
                                                )
                                            }
                                        />
                                        <label htmlFor="is-best-pages">
                                            {t('Is best pages?')}
                                        </label>
                                    </div>
                                    <div>
                                        {course.urls && (
                                            <SimpleUrlsList
                                                setUrlsList={innerSetUrlsList}
                                                language={language}
                                                urlsList={
                                                    course.urls as ISimpleUrlInput[]
                                                }
                                                visible={true}
                                                isFullWidth
                                            />
                                        )}
                                    </div>
                                </fieldset>
                            )
                        })}
                        <div className="flex justify-center">
                            <Button
                                type="button"
                                size="sm"
                                variant="default"
                                id="btn-add-course"
                                title={t('Add a course')}
                                disabled={!appReady}
                                onClick={handlerAddCourse}
                            >
                                <CirclePlus
                                    className="mr-2 size-4"
                                    aria-label={t('add')}
                                />
                                <span>{t('Add a course')}</span>
                            </Button>
                        </div>
                    </fieldset>
                </form>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
                <CardTitle>{t('3. Launch the measures')}</CardTitle>
                <CardDescription>
                    {t('Generates reports files in seleted dir.')}
                </CardDescription>
                <Button
                    variant="default"
                    type="button"
                    id="btn-simple-mesures"
                    title={t('Launch the measures')}
                    disabled={!appReady}
                    onClick={handlerOnSubmit}
                    className="btn btn-green"
                >
                    {t('Measures')}
                </Button>
            </CardFooter>
        </Card>
    )
}
