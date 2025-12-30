/**
 * Script de création de DMG pour macOS
 *
 * Alternative à @electron-forge/maker-dmg qui utilise appdmg.
 * appdmg a des problèmes de compilation avec Node.js 22+ et Python 3.13+
 * (voir https://github.com/electron/forge/issues/2807)
 *
 * Ce script utilise hdiutil (outil natif macOS) pour créer un DMG.
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { basename, dirname } from 'node:path'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

// Trouver le dernier build DMG
const makeDir = join(rootDir, 'out', 'make')
const zipDir = join(makeDir, 'zip', 'darwin')

function createDMG(appPath, dmgPath, appName) {
    const tempDir = join(dirname(dmgPath), 'dmg-temp')
    const dmgVolume = join(tempDir, 'volume')

    // Nettoyer les anciens fichiers temporaires
    if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true })
    }
    mkdirSync(dmgVolume, { recursive: true })

    // Copier l'application dans le volume en préservant la signature
    // Utiliser ditto au lieu de cp pour préserver les attributs étendus et la signature
    execSync(`ditto "${appPath}" "${dmgVolume}/${basename(appPath)}"`, {
        stdio: 'inherit',
    })

    // Créer un lien symbolique vers Applications
    execSync(`ln -s /Applications "${dmgVolume}/Applications"`, {
        stdio: 'inherit',
    })

    // Créer le DMG avec hdiutil (format UDZO compressé directement)
    console.log('Création du DMG...')
    execSync(
        `hdiutil create -volname "${appName}" -srcfolder "${dmgVolume}" -ov -format UDZO -fs HFS+ "${dmgPath}"`,
        { stdio: 'inherit' }
    )

    // Nettoyer le volume temporaire
    rmSync(tempDir, { recursive: true, force: true })

    console.log(`✅ DMG créé : ${dmgPath}`)
}

function findLatestApp() {
    try {
        if (!existsSync(zipDir)) {
            console.error(
                `Le répertoire ${zipDir} n'existe pas. Lancez d'abord 'npm run make'.`
            )
            process.exit(1)
        }

        const archDirs = readdirSync(zipDir).filter((item) => {
            const itemPath = join(zipDir, item)
            return statSync(itemPath).isDirectory()
        })

        for (const archDir of archDirs) {
            const archPath = join(zipDir, archDir)
            if (!existsSync(archPath)) continue

            const files = readdirSync(archPath)
            const zipFiles = files.filter(
                (f) => f.endsWith('.zip') && !f.includes('temp')
            )

            if (zipFiles.length > 0) {
                // Prendre le dernier ZIP
                const zipFile = join(archPath, zipFiles[zipFiles.length - 1])
                const appName = zipFiles[zipFiles.length - 1]
                    .replace('.zip', '')
                    .replace(`-${archDir}`, '')
                const extractDir = join(archPath, 'extracted')

                // Nettoyer l'ancienne extraction
                if (existsSync(extractDir)) {
                    rmSync(extractDir, { recursive: true, force: true })
                }
                mkdirSync(extractDir, { recursive: true })

                console.log(`Extraction de ${zipFile}...`)
                // Utiliser ditto pour extraire et préserver les attributs étendus et la signature
                execSync(`ditto -xk "${zipFile}" "${extractDir}"`, {
                    stdio: 'inherit',
                })

                // Trouver le .app
                const extractedFiles = readdirSync(extractDir)
                const appDir = extractedFiles.find((f) => f.endsWith('.app'))

                if (appDir) {
                    const appPath = join(extractDir, appDir)
                    const dmgPath = join(archPath, `${appName}-${archDir}.dmg`)

                    // Supprimer l'ancien DMG s'il existe
                    if (existsSync(dmgPath)) {
                        rmSync(dmgPath, { force: true })
                    }

                    console.log(`Création du DMG ${dmgPath}...`)
                    createDMG(appPath, dmgPath, appName)
                } else {
                    console.warn(`Aucun fichier .app trouvé dans ${extractDir}`)
                }
            }
        }
    } catch (err) {
        console.error('Erreur lors de la création du DMG:', err.message)
        process.exit(1)
    }
}

findLatestApp()
