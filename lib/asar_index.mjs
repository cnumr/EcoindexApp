import { existsSync, mkdir, mkdirSync, rmSync } from 'fs'
import path, { dirname } from 'path'

import asar from '@electron/asar'
import { cp } from 'fs/promises'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const log = (message) => {
    process.parentPort?.postMessage({
        type: 'progress',
        data: message.toString(),
    })
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const asarExtract = async () => {
    const src = path.join(__dirname, '..', 'lib.asar')
    const dest = path.join(__dirname, '..', 'bin', path.sep)

    try {
        // console.log ne remonte pas à la console parente, utiliser process.parentPort?.postMessage
        console.log('Extract ASAR file (from asar_index.mjs)...')
        console.log(`src: ${src}`)
        process.parentPort?.postMessage({
            type: 'progress',
            data: `src: ${src}`,
        })
        console.log(`dest: ${dest}`)
        process.parentPort?.postMessage({
            type: 'progress',
            data: `dest: ${dest}`,
        })

        console.log('Attente de 10 secondes...')
        await wait(10000)

        console.log('Création du dossier dest...')
        process.parentPort?.postMessage({
            type: 'progress',
            data: 'Création du dossier dest...',
        })
        mkdirSync(dest, { recursive: true })

        console.log('Attente de 10 secondes...')
        await wait(10000)

        await asar.extractAll(src, dest)

        console.log('Extract ASAR file done.')
        process.parentPort?.postMessage({
            type: 'complete',
            data: 'Extract ASAR file done.',
        })
        process.exit(0)
    } catch (error) {
        // Suppression du dossier lib en cas d'erreur
        try {
            if (existsSync(dest)) {
                console.log('Suppression du dossier dest...')
                process.parentPort?.postMessage({
                    type: 'progress',
                    data: 'Suppression du dossier dest...',
                })
                rmSync(dest, { recursive: true, force: true })
            }
        } catch (rmError) {
            console.error(
                'Erreur lors de la suppression du dossier dest:',
                rmError
            )
        }
        console.error('Error extracting ASAR file', error)
        process.parentPort?.postMessage({
            type: 'error',
            data: error,
        })
        process.exit(1)
    }
}

asarExtract()
