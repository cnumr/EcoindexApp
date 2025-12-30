import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type {
    IAdvancedMesureData,
    IJsonMesureData,
    IKeyValue,
} from '@/interface'
import { InputField } from '@/types'
import { utils } from '@/shared/constants'
import log from 'electron-log/renderer'

const frontLog = log.scope('front/App/useAppState')

export function useAppState() {
    // États principaux
    const [isJsonFromDisk, setIsJsonFromDisk] = useState(false)
    const [workDir, setWorkDir] = useState('loading...')
    const [homeDir, setHomeDir] = useState('loading...')
    const [appReady, setAppReady] = useState(false)
    const [datasFromHost, setDatasFromHost] = useState({})
    const [displayPopin, setDisplayPopin] = useState(false)
    const [popinText, setPopinText] = useState('')
    const [isFirstStart, setIsFirstStart] = useState(true)
    const [isPuppeteerBrowserInstalled, setIsPuppeteerBrowserInstalled] =
        useState(false)
    const [
        puppeteerBrowserInstalledVersion,
        setPuppeteerBrowserInstalledVersion,
    ] = useState('loading...')
    // États pour la popin d'information
    const [displayInformationPopin, setDisplayInformationPopin] =
        useState(false)
    const [informationPopinTitle, setInformationPopinTitle] = useState('')
    const [informationPopinErrorLink, setInformationPopinErrorLink] = useState({
        label: '',
        url: '',
    })
    const [informationPopinMessage, setInformationPopinMessage] = useState('')
    const [informationPopinIsAlert, setInformationPopinIsAlert] =
        useState(false)
    const [showInformationSpinner, setShowInformationSpinner] = useState(true)

    // États pour les mesures
    const [envVars, setEnvVars] = useState<IKeyValue>({})
    const [consoleMessages, setConsoleMessages] = useState<string>('')
    const [consoleMessagesSnapshot, setConsoleMessagesSnapshot] =
        useState<string>('')
    const [urlsList, setUrlsList] = useState<InputField[]>([
        { value: 'https://www.ecoindex.fr/' },
        { value: 'https://www.ecoindex.fr/a-propos/' },
    ])
    const [jsonDatas, setJsonDatas] = useState<IJsonMesureData>(
        utils.DEFAULT_JSON_DATA
    )
    const [localAdvConfig, setLocalAdvConfig] = useState<IAdvancedMesureData>(
        utils.DEFAULT_ADV_CONFIG
    )

    // Traduction
    const { t } = useTranslation()
    const tRef = useRef(t)
    useEffect(() => {
        tRef.current = t
    }, [t])

    // Debug: Log component render
    useEffect(() => {
        frontLog.debug('TheApp component rendered', {
            appReady,
            workDir,
            homeDir,
        })
    }, [appReady, workDir, homeDir])

    return {
        // États principaux
        isJsonFromDisk,
        setIsJsonFromDisk,
        workDir,
        setWorkDir,
        homeDir,
        setHomeDir,
        appReady,
        setAppReady,
        datasFromHost,
        setDatasFromHost,
        displayPopin,
        setDisplayPopin,
        popinText,
        setPopinText,
        isFirstStart,
        setIsFirstStart,
        isPuppeteerBrowserInstalled,
        setIsPuppeteerBrowserInstalled,
        puppeteerBrowserInstalledVersion,
        setPuppeteerBrowserInstalledVersion,
        // États popin d'information
        displayInformationPopin,
        setDisplayInformationPopin,
        informationPopinTitle,
        setInformationPopinTitle,
        informationPopinErrorLink,
        setInformationPopinErrorLink,
        informationPopinMessage,
        setInformationPopinMessage,
        informationPopinIsAlert,
        setInformationPopinIsAlert,
        showInformationSpinner,
        setShowInformationSpinner,
        // États mesures
        envVars,
        setEnvVars,
        consoleMessages,
        setConsoleMessages,
        consoleMessagesSnapshot,
        setConsoleMessagesSnapshot,
        urlsList,
        setUrlsList,
        jsonDatas,
        setJsonDatas,
        localAdvConfig,
        setLocalAdvConfig,
        // Traduction
        t,
        tRef,
    }
}
