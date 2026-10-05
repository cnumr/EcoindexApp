import path from 'node:path'

export const resolvePackagedLibScriptPath = (
    resourcesPath: string,
    platform: string,
    scriptName: string
) => {
    const platformPath = platform === 'win32' ? path.win32 : path.posix
    const libDirectory = platform === 'win32' ? 'lib' : 'lib.asar'

    return platformPath.join(resourcesPath, libDirectory, scriptName)
}
