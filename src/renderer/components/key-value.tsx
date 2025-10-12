import { CirclePlus, Trash2 } from 'lucide-react'

import { Button } from '../ui/button'
import { FC } from 'react'
import { FaPlusCircle } from 'react-icons/fa'
import { Input } from '../ui/input'
import { RiDeleteBin5Line } from 'react-icons/ri'
import { TypographyH2 } from '../ui/typography/TypographyH2'
import { cn } from '../lib/utils'
import { useTranslation } from 'react-i18next'

export interface ILayout {
    visible: boolean
    datas: IKeyValue
    setDatas?: (value: React.SetStateAction<IKeyValue>) => void
    title?: string
    displayTitle?: boolean
    isFullWidth?: boolean
    isKeyInUppercase?: boolean
}

export const KeyValue: FC<ILayout> = ({
    datas = { value: '', key: '' },
    visible = false,
    setDatas,
    title = 'Key Value (component)',
    displayTitle = false,
    isFullWidth = false,
    isKeyInUppercase = false,
}) => {
    const { t } = useTranslation()
    const Tag = isFullWidth ? 'strong' : TypographyH2
    // Function to add a new input field
    const handleAddFields = () => {
        try {
            const newDataElement: IKeyValue = isKeyInUppercase
                ? { KEY: 'value' }
                : { key: 'value' }
            setDatas({
                ...datas,
                ...newDataElement,
            })
        } catch (error) {
            console.error(t('Error adding a new input field'), error)
        }
    }

    // Function to remove an input field by index
    const handleRemoveFields = (key: string) => {
        const newInputFields = { ...datas }
        delete newInputFields[key]
        try {
            setDatas(newInputFields)
        } catch (error) {
            console.error(t('Error removing an input field'), error)
        }
    }

    // Function to update the value of an input field
    const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const values: IKeyValue = { ...datas }
        const newValue = event.currentTarget.value
        const key = event.currentTarget.dataset['key']
        values[key] = newValue
        try {
            setDatas(values)
        } catch (error) {
            console.error(
                t('Error updating the value of an input field'),
                error
            )
        }
    }
    const handleKeyChange = (
        index: number,
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const values: IKeyValue = { ...datas }
        const newKey = isKeyInUppercase
            ? event.currentTarget.value.toUpperCase()
            : event.currentTarget.value
        const oldKey = event.currentTarget.dataset['oldKey']
        const order = Object.keys(datas).map((key) => key)

        if (oldKey !== newKey) {
            Object.defineProperty(
                values,
                newKey,
                Object.getOwnPropertyDescriptor(values, oldKey)
            )
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
            setDatas(tempValues)
        } catch (error) {
            console.error(
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
                            title="delete"
                            onClick={() => handleRemoveFields(dataKey)}
                        >
                            <Trash2 className="size-4" aria-label="delete" />
                            <span className="sr-only">{t('delete')}</span>
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
                <CirclePlus className="mr-2 size-4" aria-label={t('add')} />
                {t('key-value.add.to') + ' ' + title}
            </Button>
        </div>
    )
}
