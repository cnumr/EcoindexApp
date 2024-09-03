import React, { useEffect, useState } from 'react'
import { Sun, SunMoon } from 'lucide-react'

import { Switch } from '../ui/switch'

declare module 'react' {
    interface HTMLProps<T> {
        visible?: boolean
    }
}
export const DarkModeSwitcher = React.forwardRef<
    HTMLDivElement,
    React.HTMLProps<HTMLDivElement>
>(({ className, visible = true, ...props }, ref) => {
    const [sysMode, setSysMode] = useState(false)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    useEffect(() => {
        // Add listener to update styles
        window
            .matchMedia('(prefers-color-scheme: dark)')
            .addEventListener('change', (e) =>
                setSysMode(e.matches ? true : false)
            )
        const sysMode = window.matchMedia('(prefers-color-scheme: dark)')
            .matches
            ? true
            : false
        // Setup dark/light mode for the first time
        setSysMode(sysMode)

        // Remove listener
        return () => {
            window
                .matchMedia('(prefers-color-scheme: dark)')
                .removeEventListener('change', () => {
                    return null
                })
        }
    }, [])
    useEffect(() => {
        const html = document.getElementsByTagName('html')[0]
        if (sysMode) {
            html.classList.add('dark')
        } else {
            html.classList.remove('dark')
        }
    }, [sysMode])

    return (
        visible && (
            <div className={className} {...props}>
                <div className="flex items-center gap-2">
                    <Sun className="size-4" />
                    <Switch
                        checked={sysMode}
                        onCheckedChange={(v) => setSysMode(v)}
                    />
                    <SunMoon className="size-4" />
                </div>
            </div>
        )
    )
})
