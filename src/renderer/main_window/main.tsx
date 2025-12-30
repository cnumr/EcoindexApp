import './index.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import log from 'electron-log/renderer'

import i18n from '../../configs/i18nResources'

import App from './App'

const frontLog = log.scope('front/main')

const rootElement = document.getElementById('root')
if (!rootElement) {
    frontLog.error('Root element not found!')
} else {
    try {
        ReactDOM.createRoot(rootElement).render(
            <React.StrictMode>
                <React.Suspense fallback={<div>Loading...</div>}>
                    <I18nextProvider i18n={i18n}>
                        <App />
                    </I18nextProvider>
                </React.Suspense>
            </React.StrictMode>
        )
        frontLog.debug('App rendered successfully')
    } catch (error) {
        frontLog.error('Error rendering app:', error)
        rootElement.innerHTML = `<div style="padding: 20px; color: red;">Error: ${error instanceof Error ? error.message : String(error)}</div>`
    }
}
