import logo from '../assets/tete-de-feuille.svg'
import { useTranslation } from 'react-i18next'

export const Header = () => {
    const { t } = useTranslation()
    return (
        <div className="flex items-center gap-1 py-4">
            <h1 className="flex items-center justify-center gap-1 pt-0 text-3xl font-light">
                <div className="logo-ecoindex h-fit">
                    {/* <img width="100" alt="icon" src={icon} className="bg-slate-400" /> */}
                    <span className="logo-ecoindex logo-ecoindex__eco">
                        eco
                    </span>
                    <span className="logo-ecoindex logo-ecoindex__index">
                        Index
                    </span>
                </div>
                <span className="ml-2">{t('Desktop')}</span>
                <span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="40"
                        viewBox="0 0 80 80"
                        className="ml-6"
                    >
                        <defs>
                            <clipPath id="cbkva">
                                <path
                                    fill="#fff"
                                    d="M0 33.333C0 14.923 14.924 0 33.333 0h13.334C65.077 0 80 14.924 80 33.333v13.334C80 65.077 65.076 80 46.667 80H33.333C14.923 80 0 65.076 0 46.667z"
                                />
                            </clipPath>
                            <clipPath id="cbkvb">
                                <path
                                    fill="#fff"
                                    d="M29.33 53.11c0 .53.43.96.961.96h1.923v4.807a2.403 2.403 0 0 0 4.807 0v-4.806h3.845v4.807a2.403 2.403 0 0 0 4.807 0V54.07h1.923c.531 0 .961-.43.961-.962V46.86a7.21 7.21 0 0 0-7.21-7.21H36.54a7.21 7.21 0 0 0-7.21 7.21z"
                                />
                            </clipPath>
                            <clipPath id="cbkvc">
                                <path
                                    fill="#fff"
                                    d="M37.833 37.183a9.614 9.614 0 0 1-4.92-2.062 12.567 12.567 0 0 1-1.457-1.456 9.614 9.614 0 0 1 7.486-15.645h7.212a2.404 2.404 0 0 1 2.403 2.404v7.21a9.614 9.614 0 0 1-10.724 9.55z"
                                />
                            </clipPath>
                        </defs>
                        <g>
                            <g>
                                <path
                                    fill="#009739"
                                    d="M0 33.333C0 14.923 14.924 0 33.333 0h13.334C65.077 0 80 14.924 80 33.333v13.334C80 65.077 65.076 80 46.667 80H33.333C14.923 80 0 65.076 0 46.667z"
                                />
                                <path
                                    fill="none"
                                    stroke="#fff"
                                    strokeMiterlimit="20"
                                    strokeWidth="10.67"
                                    d="M0 33.333C0 14.923 14.924 0 33.333 0h13.334C65.077 0 80 14.924 80 33.333v13.334C80 65.077 65.076 80 46.667 80H33.333C14.923 80 0 65.076 0 46.667z"
                                    clipPath='url("#cbkva")'
                                />
                            </g>
                            <g>
                                <path
                                    fill="#fff"
                                    d="M29.33 53.11c0 .53.43.96.961.96h1.923v4.807a2.403 2.403 0 0 0 4.807 0v-4.806h3.845v4.807a2.403 2.403 0 0 0 4.807 0V54.07h1.923c.531 0 .961-.43.961-.962V46.86a7.21 7.21 0 0 0-7.21-7.21H36.54a7.21 7.21 0 0 0-7.21 7.21z"
                                />
                                <path
                                    fill="none"
                                    stroke="#fff"
                                    strokeMiterlimit="20"
                                    strokeWidth="10.67"
                                    d="M29.33 53.11c0 .53.43.96.961.96h1.923v4.807a2.403 2.403 0 0 0 4.807 0v-4.806 0h3.845v4.807a2.403 2.403 0 0 0 4.807 0V54.07v0h1.923c.531 0 .961-.43.961-.962V46.86a7.21 7.21 0 0 0-7.21-7.21H36.54a7.21 7.21 0 0 0-7.21 7.21z"
                                    clipPath='url("#cbkvb")'
                                />
                            </g>
                            <g>
                                <path
                                    fill="#fff"
                                    d="M37.833 37.183a9.614 9.614 0 0 1-4.92-2.062 12.567 12.567 0 0 1-1.457-1.456 9.614 9.614 0 0 1 7.486-15.645h7.212a2.404 2.404 0 0 1 2.403 2.404v7.21a9.614 9.614 0 0 1-10.724 9.55z"
                                />
                                <path
                                    fill="none"
                                    stroke="#fff"
                                    strokeMiterlimit="20"
                                    strokeWidth="10.67"
                                    d="M37.833 37.183a9.614 9.614 0 0 1-4.92-2.062 12.567 12.567 0 0 1-1.457-1.456 9.614 9.614 0 0 1 7.486-15.645h7.212a2.404 2.404 0 0 1 2.403 2.404v7.21a9.614 9.614 0 0 1-10.724 9.55z"
                                    clipPath='url("#cbkvc")'
                                />
                            </g>
                        </g>
                    </svg>
                </span>
            </h1>
        </div>
    )
}
