type WindowOpenHandler = (details: { url: string }) => { action: 'deny' }
type NavigationHandler = (
    event: { preventDefault: () => void },
    url: string
) => void

export type ExternalLinkWebContents = {
    getURL: () => string
    setWindowOpenHandler: (handler: WindowOpenHandler) => void
    on: (event: 'will-navigate', handler: NavigationHandler) => unknown
}

type OpenExternal = (url: string) => Promise<unknown>

const getSafeExternalUrl = (url: string) => {
    try {
        const parsedUrl = new URL(url)
        return ['https:', 'mailto:'].includes(parsedUrl.protocol)
            ? parsedUrl.href
            : null
    } catch {
        return null
    }
}

const isAppOwnedNavigation = (url: string, currentUrl: string) => {
    try {
        const target = new URL(url)
        const current = new URL(currentUrl)

        if (current.protocol === 'file:') {
            return (
                target.protocol === 'file:' &&
                target.host === current.host &&
                target.pathname === current.pathname
            )
        }

        return (
            ['http:', 'https:'].includes(current.protocol) &&
            target.origin === current.origin
        )
    } catch {
        return false
    }
}

export const registerExternalLinkHandlers = (
    webContents: ExternalLinkWebContents,
    openExternal: OpenExternal,
    onError: (error: unknown) => void
) => {
    const openSafeExternalUrl = (url: string) => {
        const safeUrl = getSafeExternalUrl(url)
        if (!safeUrl) return

        try {
            void openExternal(safeUrl).catch(onError)
        } catch (error) {
            onError(error)
        }
    }

    webContents.setWindowOpenHandler(({ url }) => {
        openSafeExternalUrl(url)
        return { action: 'deny' }
    })

    webContents.on('will-navigate', (event, url) => {
        if (isAppOwnedNavigation(url, webContents.getURL())) return

        event.preventDefault()
        openSafeExternalUrl(url)
    })
}
