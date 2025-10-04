import { installMandatoryBrowser } from 'lighthouse-plugin-ecoindex-courses/install-browser'
const Browser = {
    CHROME: 'chrome',
    CHROMEHEADLESSSHELL: 'chrome-headless-shell',
    CHROMIUM: 'chromium',
    FIREFOX: 'firefox',
    CHROMEDRIVER: 'chromedriver',
}
try {
    const chrome = await installMandatoryBrowser(Browser.CHROME)
    const chromeHeadlessShell = await installMandatoryBrowser(
        Browser.CHROMEHEADLESSSHELL
    )
    if (chrome && chromeHeadlessShell) {
        process.parentPort?.postMessage({
            type: 'complete',
            data: 'Browser installed',
        })
        process.exit(0)
    } else {
        process.parentPort?.postMessage({
            type: 'error',
            data: 'Browser not installed',
        })
        process.exit(1)
    }
} catch (error) {
    console.error(error)
    process.parentPort?.postMessage({
        type: 'error',
        data: error,
    })
    process.exit(1)
}
