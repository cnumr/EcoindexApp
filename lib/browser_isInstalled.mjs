import { checkIfMandatoryBrowserInstalled } from 'lighthouse-plugin-ecoindex-courses/install-browser'

console.log(`isInstalled`, 'start...')
try {
    const isInstalled = await checkIfMandatoryBrowserInstalled()
    console.log(`isInstalled`, isInstalled !== null)
    process.parentPort?.postMessage({
        type: 'complete',
        data: isInstalled,
    })
} catch (error) {
    console.error(error)
    process.parentPort?.postMessage({
        type: 'error',
        data: error,
    })
    process.exit(1)
}
