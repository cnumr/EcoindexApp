import { useEffect } from 'react'
import log from 'electron-log/renderer'

const frontLog = log.scope('front/App/useWorkDirEffect')

interface UseWorkDirEffectProps {
    workDir: string
    runJsonReadAndReload: () => Promise<void>
}

export function useWorkDirEffect({
    workDir,
    runJsonReadAndReload,
}: UseWorkDirEffectProps) {
    useEffect(() => {
        const isJsonConfigFileExist = async () => {
            const lastWorkDir = await window.store.get(`lastWorkDir`, workDir)
            const result =
                await window.electronAPI.handleIsJsonConfigFileExist(
                    lastWorkDir
                )
            frontLog.log(`isJsonConfigFileExist`, result)

            result && runJsonReadAndReload()
        }
        isJsonConfigFileExist()
    }, [workDir, runJsonReadAndReload])
}
