type ISimpleUrlInput = {
    value: string
}

type InputField = {
    value: string
}

type ResultMessage = {
    result: boolean
    message: string
    actualVersion?: string
    targetVersion?: string
}

type InitalizationMessage = {
    type: 'initalization'
    modalType: 'started' | 'error' | 'completed'
    title: string
    message: string
}
