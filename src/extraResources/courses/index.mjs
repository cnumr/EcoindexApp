import { dirname, resolve } from 'path'

import { fileURLToPath } from 'url'
import fs from 'fs'
import { runCourses as runCoursesCli } from 'lighthouse-plugin-ecoindex-courses/run'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('Current directory:', __dirname)

// Utiliser le répertoire de travail passé via la variable d'environnement
const workDir = process.env.WORK_DIR
if (!workDir) {
    console.error('WORK_DIR environment variable is not set')
    process.parentPort?.postMessage({
        type: 'error',
        data: 'WORK_DIR environment variable is not set',
    })
    process.exit(1)
}
console.log('Work directory:', workDir)

const tempFilePath = resolve(workDir, 'command-data.json')
console.log('Temporary file path:', tempFilePath)

// Vérifier si le fichier existe
if (fs.existsSync(tempFilePath)) {
    console.log('File exists, size:', fs.statSync(tempFilePath).size)
} else {
    console.error('Command data file does not exist')
    process.parentPort?.postMessage({
        type: 'error',
        data: 'Command data file does not exist',
    })
    process.exit(1)
}

let command
try {
    console.log('Reading command data from file')
    const commandData = fs.readFileSync(tempFilePath, 'utf8')
    command = JSON.parse(commandData)
    console.log('Command data:', JSON.stringify(command, null, 2))
} catch (error) {
    console.error('Error reading command data:', error)
    process.parentPort?.postMessage({
        type: 'error',
        data: `Error reading command data: ${error.message}`,
    })
    process.exit(1)
}

// Exécuter avec les données de la commande
console.log('Starting with command:', JSON.stringify(command, null, 2))
try {
    await runCoursesCli(command)
    console.log('Courses completed successfully')
    process.parentPort?.postMessage({
        type: 'complete',
        data: 'Courses completed successfully',
    })
    process.exit(0)
} catch (error) {
    console.error('Error running courses:', error)
    process.parentPort?.postMessage({
        type: 'error',
        data: `Error running courses: ${error.message}`,
    })
    process.exit(1)
}
