import { Trans, useTranslation } from 'react-i18next'

import iconAsso from '../../../assets/asso.svg'

export const Footer = ({
  nodeVersion,
  pluginVersion,
  appVersion,
  repoUrl,
}: {
  nodeVersion: string
  pluginVersion: string
  appVersion: string
  repoUrl: string
}) => {
  const { t } = useTranslation()
  const currentYear = new Date(Date.now()).getFullYear()
  return (
    <div className="text-center text-sm">
      <p className="text-xs">
        {t('Host Informations:')}: Node.js(
        {nodeVersion ? nodeVersion : t('loading...')}),
        Lighthouse-plugin-ecoindex (
        {pluginVersion ? pluginVersion.trim() : t('loading...')})
      </p>
      <p className="text-xs">
        <a href={repoUrl} title="Visite website" target="_blank">
          {t('Application version:')} {appVersion}
        </a>
      </p>
      <p className="text-xs">
        {t('Internal Electron informations: Chrome')} (v
        {window.versions.chrome()}
        ), Node.js (v
        {window.versions.node()}), {t('and')} Electron (v
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
          <img width="100" alt="icon" src={iconAsso} className="bg-green-950" />
        </a>
      </p>
    </div>
  )
}
