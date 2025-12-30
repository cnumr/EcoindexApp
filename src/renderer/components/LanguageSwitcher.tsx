import { Button } from '@/renderer/components/ui/button'
import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
    const { i18n, t } = useTranslation()
    // Utiliser directement i18n.language comme source de vérité, pas d'état local
    const currentLang = i18n.language

    const handleLanguageChange = async (lang: string) => {
        // Notifier le processus principal pour mettre à jour le menu
        // Le main process changera la langue et App.tsx mettra à jour i18n
        // i18n.language sera automatiquement mis à jour, ce qui re-rendra le composant
        if (window.electronAPI) {
            await window.electronAPI.changeLanguage(lang)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
                {t('language.label')}:
            </span>
            <div className="flex gap-1">
                <Button
                    variant={currentLang === 'fr' ? 'secondary' : 'default'}
                    size="sm"
                    onClick={() => handleLanguageChange('fr')}
                    aria-label={t('language.french')}
                    disabled={currentLang === 'fr'}
                >
                    FR
                </Button>
                <Button
                    variant={currentLang === 'en' ? 'secondary' : 'default'}
                    size="sm"
                    onClick={() => handleLanguageChange('en')}
                    aria-label={t('language.english')}
                    disabled={currentLang === 'en'}
                >
                    EN
                </Button>
            </div>
        </div>
    )
}
