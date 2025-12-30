import * as os from 'node:os'

import { access, readdir } from 'fs/promises'

import { exec } from 'child_process'
import path from 'node:path'

const pathExists = async (candidatePath: string): Promise<boolean> => {
    try {
        await access(candidatePath)
        return true
    } catch {
        return false
    }
}

const expandHome = (p: string): string => {
    if (p === '~') return os.homedir()
    if (p.startsWith('~/')) return os.homedir() + p.slice(1)
    return p
}

const listDirectories = async (dir: string): Promise<string[]> => {
    try {
        const entries = await readdir(dir, { withFileTypes: true })
        return entries.filter((e) => e.isDirectory()).map((e) => e.name)
    } catch {
        return []
    }
}

const sortNodeVersionsDesc = (versions: string[]): string[] => {
    return versions
        .map((v) => v.replace(/^v/, ''))
        .sort((a, b) => {
            const pa = a.split('.').map((n) => parseInt(n, 10))
            const pb = b.split('.').map((n) => parseInt(n, 10))
            for (let i = 0; i < 3; i++) {
                const da = pa[i] || 0
                const db = pb[i] || 0
                if (db !== da) return db - da
            }
            return 0
        })
        .map((v) => `v${v}`)
}

export const resolveNodeBinary = async (): Promise<string | null> => {
    const whichCmd = process.platform === 'win32' ? 'where node' : 'which node'
    const foundViaWhich = await new Promise<string | null>((resolve) => {
        exec(whichCmd, (err, stdout) => {
            if (err) return resolve(null)
            const out = (stdout || '').trim()
            if (!out) return resolve(null)
            const first = out.split(/\r?\n/)[0]
            resolve(first || null)
        })
    })
    if (foundViaWhich && (await pathExists(foundViaWhich))) return foundViaWhich

    const candidates: string[] = []
    if (process.platform === 'darwin') {
        candidates.push('/opt/homebrew/bin/node')
        candidates.push('/usr/local/bin/node')
        candidates.push('/usr/bin/node')
        candidates.push(expandHome('~/.volta/bin/node'))
        // Homebrew nvm-managed installations
        const brewOptNvmNodeRoot = [
            '/opt/homebrew/opt/nvm/versions/node',
            '/usr/local/opt/nvm/versions/node',
        ]
        for (const root of brewOptNvmNodeRoot) {
            const nodeVersions = await listDirectories(root)
            const sortedNvm = sortNodeVersionsDesc(nodeVersions)
            for (const v of sortedNvm) {
                candidates.push(path.join(root, v, 'bin', 'node'))
            }
        }
        const brewCellarNvmRoot = [
            '/opt/homebrew/Cellar/nvm',
            '/usr/local/Cellar/nvm',
        ]
        for (const root of brewCellarNvmRoot) {
            const nvmVersions = await listDirectories(root)
            for (const nvmv of nvmVersions) {
                const nodeRoot = path.join(root, nvmv, 'versions', 'node')
                const nodeVersions = await listDirectories(nodeRoot)
                const sorted = sortNodeVersionsDesc(nodeVersions)
                for (const v of sorted) {
                    candidates.push(path.join(nodeRoot, v, 'bin', 'node'))
                }
            }
        }
        // Homebrew opt prefixes (unversioned and versioned formulae like node@20)
        const brewOptRoots = ['/opt/homebrew/opt', '/usr/local/opt']
        for (const root of brewOptRoots) {
            const dirs = await listDirectories(root)
            const nodeDirs = dirs.filter(
                (d) => d === 'node' || d.startsWith('node@')
            )
            // sort to try unversioned 'node' first, then higher @version
            nodeDirs.sort((a, b) =>
                a === 'node' ? -1 : b === 'node' ? 1 : a.localeCompare(b)
            )
            for (const d of nodeDirs) {
                candidates.push(path.join(root, d, 'bin', 'node'))
            }
        }
        // Homebrew Cellar fallback
        const brewCellarRoots = [
            '/opt/homebrew/Cellar/node',
            '/usr/local/Cellar/node',
        ]
        for (const root of brewCellarRoots) {
            const versions = await listDirectories(root)
            // try higher versions first
            versions.sort((a, b) =>
                b.localeCompare(a, undefined, {
                    numeric: true,
                    sensitivity: 'base',
                })
            )
            for (const v of versions) {
                candidates.push(path.join(root, v, 'bin', 'node'))
            }
        }
        const nvmRoot = expandHome('~/.nvm/versions/node')
        const nvmVersions = await listDirectories(nvmRoot)
        const sorted = sortNodeVersionsDesc(nvmVersions)
        for (const v of sorted) {
            candidates.push(path.join(nvmRoot, v, 'bin', 'node'))
        }
        const asdfRoot = expandHome('~/.asdf/installs/nodejs')
        const asdfVersions = await listDirectories(asdfRoot)
        const asdfSorted = sortNodeVersionsDesc(asdfVersions)
        for (const v of asdfSorted) {
            candidates.push(path.join(asdfRoot, v, 'bin', 'node'))
        }
    } else if (process.platform === 'linux') {
        candidates.push('/usr/bin/node')
        candidates.push('/usr/local/bin/node')
        candidates.push(expandHome('~/.volta/bin/node'))
        const nvmRoot = expandHome('~/.nvm/versions/node')
        const nvmVersions = await listDirectories(nvmRoot)
        const sorted = sortNodeVersionsDesc(nvmVersions)
        for (const v of sorted) {
            candidates.push(path.join(nvmRoot, v, 'bin', 'node'))
        }
        const asdfRoot = expandHome('~/.asdf/installs/nodejs')
        const asdfVersions = await listDirectories(asdfRoot)
        const asdfSorted = sortNodeVersionsDesc(asdfVersions)
        for (const v of asdfSorted) {
            candidates.push(path.join(asdfRoot, v, 'bin', 'node'))
        }
    } else {
        candidates.push('C:\\Program Files\\nodejs\\node.exe')
        const localApp = process.env.LOCALAPPDATA
        if (localApp) {
            candidates.push(path.join(localApp, 'Volta', 'bin', 'node.exe'))
        }
        if (process.env.NVM_HOME) {
            candidates.push(path.join(process.env.NVM_HOME, 'node.exe'))
        }
        if (process.env.NVM_SYMLINK) {
            candidates.push(path.join(process.env.NVM_SYMLINK, 'node.exe'))
        }
    }

    for (const c of candidates) {
        const full = expandHome(c)
        if (await pathExists(full)) return full
    }

    return null
}

/**
 * Convert Version to string (shared util safe for renderer)
 */
export const convertVersion = (version: string) => {
    return version.replace(/\./gm, '_').replace(/-/gm, '_')
}
