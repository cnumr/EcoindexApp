import { CirclePlus, Trash2, FileText, Grid3x3 } from 'lucide-react'
import React, { FC, useMemo, useState } from 'react'

import { Button } from './ui/button'
import type { ISimpleUrlInput } from '@/interface'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { TypographyH2 } from './ui/typography/TypographyH2'
import { cn } from '@/renderer/lib/utils'
import { useTranslation } from 'react-i18next'
import log from 'electron-log/renderer'

const frontLog = log.scope('front/SimpleUrlsList')

export interface ILayout {
    language: string
    visible: boolean
    urlsList: ISimpleUrlInput[]
    setUrlsList?: (urlsList: ISimpleUrlInput[]) => void
    title?: string
    isFullWidth?: boolean
    enableTextMode?: boolean
    placeholder?: string
    textModeFormat?: string
}

export const SimpleUrlsList: FC<ILayout> = ({
    language: _language,
    urlsList = [{ value: '' }],
    visible = false,
    setUrlsList,
    title,
    isFullWidth = false,
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
     * Convertit une liste d'URLs en texte (une URL par ligne)
     */
    const urlsListToText = (urls: ISimpleUrlInput[]): string => {
        return urls.map((url) => url.value).join('\n')
    }

    /**
     * Convertit un texte (une URL par ligne) en liste d'URLs
     * Valide le format et retourne une erreur si invalide
     */
    const textToUrlsList = (
        text: string
    ): { data: ISimpleUrlInput[] | null; error: string | null } => {
        const lines = text.split('\n').filter((line) => line.trim() !== '')
        const result: ISimpleUrlInput[] = []
        const errors: string[] = []

        lines.forEach((line) => {
            const trimmedLine = line.trim()
            if (trimmedLine === '') return

            // Validation basique d'URL (peut être améliorée)
            try {
                // Vérifier que c'est une URL valide
                new URL(trimmedLine)
                result.push({ value: trimmedLine })
            } catch {
                // Si ce n'est pas une URL valide, on l'accepte quand même
                // mais on pourrait ajouter un warning
                result.push({ value: trimmedLine })
            }
        })

        if (errors.length > 0) {
            return { data: null, error: errors.join('\n') }
        }

        return { data: result, error: null }
    }

    /**
     * Valeur du texte dérivée des URLs
     */
    const derivedTextValue = useMemo(() => urlsListToText(urlsList), [urlsList])

    /**
     * Initialise le texte quand on entre en mode texte pour la première fois
     */
    const handleTextModeToggle = () => {
        const newTextMode = !isTextMode
        if (newTextMode && enableTextMode && !hasEnteredTextMode) {
            // On entre en mode texte : initialiser avec les URLs
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
            setUrlsList?.([...urlsList, { value: '' }])
        } catch (error) {
            frontLog.error(t('Error adding a new input field'), error)
        }
    }

    // Function to remove an input field by index
    const handleRemoveFields = (index: number) => {
        const newInputFields = [...urlsList]
        newInputFields.splice(index, 1)
        try {
            setUrlsList?.(newInputFields)
        } catch (error) {
            frontLog.error(t('Error removing an input field'), error)
        }
    }

    // Function to update the value of an input field
    const handleValueChange = (
        index: number,
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const values = [...urlsList]
        values[index].value = event.target.value
        try {
            setUrlsList?.(values)
        } catch (error) {
            frontLog.error(
                t('Error updating the value of an input field'),
                error
            )
        }
    }
    return (
        <div
            className={cn('flex w-full flex-col justify-start gap-4', {
                hidden: !visible,
                '!items-center': !isFullWidth,
                '!items-start': isFullWidth,
            })}
        >
            {title !== '' && (
                <Tag
                    className={cn({
                        'max-w-fit text-primary dark:text-foreground':
                            isFullWidth,
                        'text-center': !isFullWidth,
                    })}
                >
                    {t('Urls to mesure') || title}
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
                            const { data, error } = textToUrlsList(newText)
                            setTextError(error)
                            if (data && !error && setUrlsList) {
                                setUrlsList(data)
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
                            'https://www.example.com/\nhttps://www.example2.com/'
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
                <div
                    className={cn('mx-auto flex flex-col items-center gap-4', {
                        'w-full': isFullWidth,
                        'w-2/3': !isFullWidth,
                    })}
                >
                    {urlsList.map((urlItem, index) => (
                        <div key={index} className="flex w-full gap-4">
                            <Input
                                type="text"
                                placeholder={t('Enter an url')}
                                value={urlItem.value}
                                onChange={(e) => handleValueChange(index, e)}
                                className="block w-full"
                            />

                            <Button
                                variant="destructive"
                                type="button"
                                size="icon"
                                id="btn-remove-url"
                                className=""
                                title={t('delete')}
                                onClick={() => handleRemoveFields(index)}
                            >
                                <Trash2
                                    className="size-4"
                                    aria-label={t('delete')}
                                />
                                <span className="sr-only">{t('delete')}</span>
                            </Button>
                        </div>
                    ))}

                    <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        id="btn-add-url"
                        className=""
                        title={t('add')}
                        onClick={handleAddFields}
                    >
                        <CirclePlus className="mr-2 size-4" aria-label="add" />
                        {t('Add an URL')}
                    </Button>
                </div>
            )}
        </div>
    )
}
