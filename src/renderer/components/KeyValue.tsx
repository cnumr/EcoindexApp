import { CirclePlus, Trash2, FileText, Grid3x3 } from 'lucide-react'

import { Button } from './ui/button'
import React, { FC, useMemo, useState } from 'react'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { TypographyH2 } from './ui/typography/TypographyH2'
import { cn } from '@/renderer/lib/utils'
import { useTranslation } from 'react-i18next'
import type { IKeyValue } from '@/interface'
import log from 'electron-log/renderer'

const frontLog = log.scope('front/KeyValue')

export interface ILayout {
    visible: boolean
    datas: IKeyValue
    setDatas?: (value: React.SetStateAction<IKeyValue>) => void
    title?: string
    displayTitle?: boolean
    isFullWidth?: boolean
    isKeyInUppercase?: boolean
    enableTextMode?: boolean
    placeholder?: string
    textModeFormat?: string
}

export const KeyValue: FC<ILayout> = ({
    datas = { value: '', key: '' },
    visible = false,
    setDatas,
    title = 'Key Value (component)',
    displayTitle = false,
    isFullWidth = false,
    isKeyInUppercase = false,
    enableTextMode = false,
    placeholder,
    textModeFormat,
}) => {
    const { t } = useTranslation()
    const Tag = isFullWidth ? 'strong' : TypographyH2

    /**
     * Mode de saisie (false = formulaire, true = texte libre)
     */
    const [isTextMode, setIsTextMode] = useState(false)

    /**
     * Texte brut en mode texte libre
     */
    const [textValue, setTextValue] = useState('')

    /**
     * Erreur de validation
     */
    const [textError, setTextError] = useState<string | null>(null)

    /**
     * État pour suivre si on vient d'entrer en mode texte
     */
    const [hasEnteredTextMode, setHasEnteredTextMode] = useState(false)

    /**
     * Convertit un objet IKeyValue en texte (format clé=valeur, une par ligne)
     */
    const keyValueToText = (keyValue: IKeyValue): string => {
        return Object.entries(keyValue)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n')
    }

    /**
     * Convertit un texte (format clé=valeur, une par ligne) en objet IKeyValue
     * Valide le format et retourne une erreur si invalide
     */
    const textToKeyValue = (
        text: string
    ): { data: IKeyValue | null; error: string | null } => {
        const lines = text.split('\n').filter((line) => line.trim() !== '')
        const result: IKeyValue = {}
        const errors: string[] = []

        lines.forEach((line, index) => {
            const trimmedLine = line.trim()
            if (trimmedLine === '') return

            // Vérifier le format clé=valeur
            const equalIndex = trimmedLine.indexOf('=')
            if (equalIndex === -1) {
                errors.push(
                    `Ligne ${index + 1}: format invalide. Format attendu: clé=valeur`
                )
                return
            }

            const key = trimmedLine.substring(0, equalIndex).trim()
            const value = trimmedLine.substring(equalIndex + 1).trim()

            if (key === '') {
                errors.push(`Ligne ${index + 1}: la clé ne peut pas être vide`)
                return
            }

            const finalKey = isKeyInUppercase ? key.toUpperCase() : key
            result[finalKey] = value
        })

        if (errors.length > 0) {
            return { data: null, error: errors.join('\n') }
        }

        return { data: result, error: null }
    }

    /**
     * Valeur du texte dérivée des données
     * Utilisée pour initialiser le textarea quand on entre en mode texte
     */
    const derivedTextValue = useMemo(() => keyValueToText(datas), [datas])

    /**
     * Initialise le texte quand on entre en mode texte pour la première fois
     */
    const handleTextModeToggle = () => {
        const newTextMode = !isTextMode
        if (newTextMode && enableTextMode && !hasEnteredTextMode) {
            // On entre en mode texte : initialiser avec les données
            setTextValue(derivedTextValue)
            setTextError(null)
            setHasEnteredTextMode(true)
        } else if (!newTextMode) {
            // On sort du mode texte : réinitialiser l'état
            setHasEnteredTextMode(false)
        }
        setIsTextMode(newTextMode)
    }

    /**
     * Valeur du textarea : utilise la valeur dérivée si on vient d'entrer en mode texte,
     * sinon utilise la valeur modifiée par l'utilisateur
     */
    const textareaValue = useMemo(() => {
        if (isTextMode && enableTextMode) {
            if (!hasEnteredTextMode || textValue === '') {
                // Première fois qu'on entre en mode texte ou texte vide
                return derivedTextValue
            }
            // L'utilisateur a modifié le texte, utiliser sa valeur
            return textValue
        }
        return textValue
    }, [
        isTextMode,
        enableTextMode,
        textValue,
        derivedTextValue,
        hasEnteredTextMode,
    ])
    // Function to add a new input field
    const handleAddFields = () => {
        try {
            const newDataElement: IKeyValue = isKeyInUppercase
                ? { KEY: 'value' }
                : { key: 'value' }
            setDatas?.({
                ...datas,
                ...newDataElement,
            })
        } catch (error) {
            frontLog.error(t('Error adding a new input field'), error)
        }
    }

    // Function to remove an input field by index
    const handleRemoveFields = (key: string) => {
        const newInputFields = { ...datas }
        delete newInputFields[key]
        try {
            setDatas?.(newInputFields)
        } catch (error) {
            frontLog.error(t('Error removing an input field'), error)
        }
    }

    // Function to update the value of an input field
    const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const values: IKeyValue = { ...datas }
        const newValue = event.currentTarget.value
        const key = event.currentTarget.dataset['key']
        if (!key) return
        values[key] = newValue
        try {
            setDatas?.(values)
        } catch (error) {
            frontLog.error(
                t('Error updating the value of an input field'),
                error
            )
        }
    }
    const handleKeyChange = (
        _index: number,
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const values: IKeyValue = { ...datas }
        const newKey = isKeyInUppercase
            ? event.currentTarget.value.toUpperCase()
            : event.currentTarget.value
        const oldKey = event.currentTarget.dataset['oldKey']
        const order = Object.keys(datas).map((key) => key)

        if (oldKey && oldKey !== newKey) {
            const descriptor = Object.getOwnPropertyDescriptor(values, oldKey)
            if (descriptor) {
                Object.defineProperty(values, newKey, descriptor)
            }
            // delete values[oldKey]
        }
        const tempValues: IKeyValue = {}
        order.forEach((element: string) => {
            if (element !== oldKey) {
                tempValues[element] = values[element]
            } else {
                tempValues[newKey] = values[element]
            }
        })
        try {
            setDatas?.(tempValues)
        } catch (error) {
            frontLog.error(
                t('Error updating the value of an input field'),
                error
            )
        }
    }
    return (
        <div
            className={cn('flex w-full flex-col gap-4', {
                hidden: !visible,
                '!items-center': !isFullWidth,
                '!items-start': isFullWidth,
            })}
        >
            {displayTitle && title !== '' && (
                <Tag
                    className={cn({
                        'max-w-fit text-primary dark:text-foreground':
                            isFullWidth,
                        'text-center': !isFullWidth,
                    })}
                >
                    {title}
                </Tag>
            )}
            {enableTextMode && (
                <div className="flex w-full items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleTextModeToggle}
                        title={
                            isTextMode
                                ? t('advConfiguration.switchToFormMode')
                                : t('advConfiguration.switchToTextMode')
                        }
                    >
                        {isTextMode ? (
                            <>
                                <Grid3x3 className="mr-2 size-4" />
                                {t('advConfiguration.formMode')}
                            </>
                        ) : (
                            <>
                                <FileText className="mr-2 size-4" />
                                {t('advConfiguration.textMode')}
                            </>
                        )}
                    </Button>
                </div>
            )}
            {isTextMode && enableTextMode ? (
                <div className="flex flex-col gap-2">
                    <Textarea
                        value={textareaValue}
                        onChange={(e) => {
                            const newText = e.target.value
                            setTextValue(newText)
                            const { data, error } = textToKeyValue(newText)
                            setTextError(error)
                            if (data && !error && setDatas) {
                                setDatas(data)
                            }
                        }}
                        onKeyDown={(e) => {
                            // Gérer manuellement les retours à la ligne
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                e.stopPropagation()
                                const textarea = e.currentTarget
                                const start = textarea.selectionStart
                                const end = textarea.selectionEnd
                                const newText =
                                    textareaValue.substring(0, start) +
                                    '\n' +
                                    textareaValue.substring(end)
                                setTextValue(newText)
                                // Restaurer la position du curseur après le retour à la ligne
                                setTimeout(() => {
                                    textarea.selectionStart =
                                        textarea.selectionEnd = start + 1
                                }, 0)
                            }
                        }}
                        wrap="soft"
                        placeholder={
                            placeholder ||
                            'key=value\nanother-key=another-value'
                        }
                        rows={6}
                        className={textError ? 'border-destructive' : ''}
                    />
                    {textError && (
                        <p className="text-sm text-destructive">{textError}</p>
                    )}
                    {textModeFormat && (
                        <p className="text-xs text-muted-foreground">
                            {textModeFormat}
                        </p>
                    )}
                </div>
            ) : (
                <>
                    {Object.keys(datas).map((dataKey, index) => {
                        return (
                            <div
                                className={cn('flex items-center gap-4', {
                                    'w-full': isFullWidth,
                                    'w-2/3': !isFullWidth,
                                })}
                                key={index}
                                data-idx={index}
                            >
                                <Input
                                    type="text"
                                    data-idx={index}
                                    data-key={dataKey}
                                    data-type="key"
                                    data-old-key={dataKey}
                                    placeholder={t('Enter a key')}
                                    value={dataKey}
                                    onChange={(e) => handleKeyChange(index, e)}
                                    className="block w-full"
                                />
                                <Input
                                    type="text"
                                    data-idx-value={index}
                                    data-key={dataKey}
                                    data-type="value"
                                    placeholder={t('Enter a value')}
                                    value={datas[dataKey]}
                                    onChange={(e) => handleValueChange(e)}
                                    className="block w-full"
                                />

                                <Button
                                    variant="destructive"
                                    type="button"
                                    id="btn-remove-url"
                                    title={t('delete')}
                                    onClick={() => handleRemoveFields(dataKey)}
                                >
                                    <Trash2
                                        className="size-4"
                                        aria-label={t('delete')}
                                    />
                                    <span className="sr-only">
                                        {t('delete')}
                                    </span>
                                </Button>
                            </div>
                        )
                    })}

                    <Button
                        variant="secondary"
                        type="button"
                        size="sm"
                        id="btn-add-url"
                        className=""
                        title={t('add')}
                        onClick={handleAddFields}
                    >
                        <CirclePlus
                            className="mr-2 size-4"
                            aria-label={t('add')}
                        />
                        {t('key-value.add.to') + ' ' + title}
                    </Button>
                </>
            )}
        </div>
    )
}
