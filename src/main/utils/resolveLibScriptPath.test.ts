import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { resolvePackagedLibScriptPath } from './resolveLibScriptPath.ts'

describe('resolvePackagedLibScriptPath', () => {
    it('uses the extracted resources/lib directory on Windows', () => {
        const resourcesPath =
            'C:\\Users\\hrena\\AppData\\Local\\ecoindex-app\\app-0.12.4\\resources'

        assert.equal(
            resolvePackagedLibScriptPath(
                resourcesPath,
                'win32',
                'browser_isInstalled.mjs'
            ),
            `${resourcesPath}\\lib\\browser_isInstalled.mjs`
        )
    })

    it('uses resources/lib.asar on macOS', () => {
        assert.equal(
            resolvePackagedLibScriptPath(
                '/Applications/EcoindexApp.app/Contents/Resources',
                'darwin',
                'browser_install.mjs'
            ),
            '/Applications/EcoindexApp.app/Contents/Resources/lib.asar/browser_install.mjs'
        )
    })

    it('uses resources/lib.asar on Linux', () => {
        assert.equal(
            resolvePackagedLibScriptPath(
                '/usr/lib/ecoindex-app/resources',
                'linux',
                'courses_index.mjs'
            ),
            '/usr/lib/ecoindex-app/resources/lib.asar/courses_index.mjs'
        )
    })
})
