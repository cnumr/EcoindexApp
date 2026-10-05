import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
    registerExternalLinkHandlers,
    type ExternalLinkWebContents,
} from './externalLinks.ts'

const setup = (currentUrl = 'file:///Applications/EcoindexApp/index.html') => {
    let handleWindowOpen:
        | ((details: { url: string }) => { action: 'deny' })
        | null = null
    let handleNavigation:
        | ((event: { preventDefault: () => void }, url: string) => void)
        | null = null
    const openedUrls: string[] = []
    const errors: unknown[] = []

    const webContents: ExternalLinkWebContents = {
        getURL: () => currentUrl,
        setWindowOpenHandler: (handler) => {
            handleWindowOpen = handler
        },
        on: (_event, handler) => {
            handleNavigation = handler
        },
    }

    registerExternalLinkHandlers(
        webContents,
        async (url) => {
            openedUrls.push(url)
        },
        (error) => errors.push(error)
    )

    return {
        errors,
        getNavigationHandler: () => {
            assert.ok(handleNavigation)
            return handleNavigation
        },
        getWindowOpenHandler: () => {
            assert.ok(handleWindowOpen)
            return handleWindowOpen
        },
        openedUrls,
    }
}

describe('registerExternalLinkHandlers', () => {
    it('opens HTTPS new-window requests in the host browser and denies Electron windows', () => {
        const { getWindowOpenHandler, openedUrls } = setup()

        const result = getWindowOpenHandler()({
            url: 'https://example.com/path',
        })

        assert.deepEqual(result, { action: 'deny' })
        assert.deepEqual(openedUrls, ['https://example.com/path'])
    })

    it('opens mail links with the host and prevents renderer navigation', () => {
        const { getNavigationHandler, openedUrls } = setup()
        let prevented = false

        getNavigationHandler()(
            { preventDefault: () => (prevented = true) },
            'mailto:contact@example.com'
        )

        assert.equal(prevented, true)
        assert.deepEqual(openedUrls, ['mailto:contact@example.com'])
    })

    it('allows renderer reloads and other app-owned navigation', () => {
        const { getNavigationHandler, openedUrls } = setup()
        let prevented = false

        getNavigationHandler()(
            { preventDefault: () => (prevented = true) },
            'file:///Applications/EcoindexApp/index.html'
        )

        assert.equal(prevented, false)
        assert.deepEqual(openedUrls, [])
    })

    it('blocks remote file URLs even when their path matches the app', () => {
        const { getNavigationHandler, openedUrls } = setup()
        let prevented = false

        getNavigationHandler()(
            { preventDefault: () => (prevented = true) },
            'file://attacker/Applications/EcoindexApp/index.html'
        )

        assert.equal(prevented, true)
        assert.deepEqual(openedUrls, [])
    })

    it('denies unsupported or malformed external URLs without opening them', () => {
        const { getWindowOpenHandler, openedUrls } = setup()
        const handleWindowOpen = getWindowOpenHandler()

        for (const url of [
            'http://example.com',
            'javascript:alert(1)',
            'file:///tmp/file',
            'not a url',
        ]) {
            assert.deepEqual(handleWindowOpen({ url }), { action: 'deny' })
        }

        assert.deepEqual(openedUrls, [])
    })

    it('reports host opening failures without allowing an Electron window', async () => {
        let handleWindowOpen:
            | ((details: { url: string }) => { action: 'deny' })
            | null = null
        const expectedError = new Error('host rejected URL')
        const errors: unknown[] = []

        registerExternalLinkHandlers(
            {
                getURL: () => 'file:///Applications/EcoindexApp/index.html',
                setWindowOpenHandler: (handler) => {
                    handleWindowOpen = handler
                },
                on: () => undefined,
            },
            async () => Promise.reject(expectedError),
            (error) => errors.push(error)
        )

        const getWindowOpenHandler = () => {
            assert.ok(handleWindowOpen)
            return handleWindowOpen
        }

        assert.deepEqual(
            getWindowOpenHandler()({ url: 'https://example.com' }),
            {
                action: 'deny',
            }
        )
        await new Promise((resolve) => setImmediate(resolve))
        assert.deepEqual(errors, [expectedError])
    })
})
