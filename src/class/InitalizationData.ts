type InitalizationDataType =
    | 'workDir'
    | 'homeDir'
    | 'appReady'
    | 'puppeteer_browser_installed'
    | 'puppeteer_browser_installation'
    | 'app_can_not_be_launched'
export class InitalizationData {
    [x: string]: string
    static WORKDIR = 'workDir'
    static HOMEDIR = 'homeDir'
    static APP_READY = 'appReady'
    static PUPPETEER_BROWSER_INSTALLED = 'puppeteer_browser_installed'
    static PUPPETEER_BROWSER_INSTALLATION = 'puppeteer_browser_installation'
    static APP_CAN_NOT_BE_LAUNCHED = 'app_can_not_be_launched'
    type: InitalizationDataType
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: any
    //     type InitalizationData = {
    //     type:
    //         | 'workDir'
    //         | 'homeDir'
    //         | 'appReady'
    //         | 'puppeteer_browser_installed'
    //         | 'puppeteer_browser_installation'
    //         | 'app_can_not_be_launched'
    // }
    public constructor() {
        //
    }
}
