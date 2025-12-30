import { InitalizationData } from './class/InitalizationData'

export type ISimpleUrlInput = {
    value: string
}

type InputField = {
    value: string
}

export type ResultMessage = {
    result: boolean
    message: string
    actualVersion?: string
    targetVersion?: string
}

export type InitalizationMessage = {
    type: 'message' | 'data'
    modalType: 'started' | 'error' | 'completed'
    title: string
    message: string
    data?: InitalizationData
    step?: number
    steps?: number
    errorLink?: {
        label: string
        url: string
    }
}
