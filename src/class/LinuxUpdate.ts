export class LinuxUpdate {
    readonly latestReleaseVersion: string
    readonly latestReleaseURL: string
    public constructor(version: string, url: string) {
        this.latestReleaseVersion = version
        this.latestReleaseURL = url
    }
}
