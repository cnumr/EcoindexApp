import { Trans, useTranslation } from 'react-i18next'

import iconAsso from '../../../assets/asso.svg'

export const Footer = ({
    appVersion,
    repoUrl,
    coursesVersion,
}: {
    appVersion: string
    repoUrl: string
    coursesVersion: string
}) => {
    const { t } = useTranslation()
    const currentYear = new Date().getFullYear()
    return (
        <div className="text-center text-sm">
            <p className="text-xs">
                <a
                    href={repoUrl}
                    title={t('footer.visite-website.app')}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                >
                    {t('Application version:')} {appVersion}
                </a>
            </p>
            <p className="mb-4 text-xs">
                <a
                    href="https://lighthouse-ecoindex.greenit.eco/"
                    title={t('footer.visite-website.plugin')}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                >
                    {t('Plugin version:')} {coursesVersion?.match(/[0-9.]/g)}
                </a>
            </p>
            <p className="text-xs">
                {t('Internal Electron informations: Chrome')} (v
                {window.versions.chrome()}
                ), Node.js (v
                {window.versions.node()}) {t('and')} Electron (v
                {window.versions.electron()})
            </p>
            {/* <p className="mt-2">{t('© 2024 - Made with ❤️ and 🌱 by')}</p> */}
            <p className="mt-2">
                <Trans i18nKey="footerCopyright" currentYear={currentYear}>
                    © {{ currentYear }} - Made with ❤️ and 🌱 by
                </Trans>
            </p>
            <p className="my-4 grid place-content-center">
                <a href="https://asso.greenit.fr">
                    <img
                        width="100"
                        alt="icon"
                        src={iconAsso}
                        className="bg-green-950"
                    />
                </a>
            </p>
        </div>
    )
}
