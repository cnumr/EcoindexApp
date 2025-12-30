import React, { useEffect, useState } from 'react'
import { Sun, SunMoon } from 'lucide-react'

import { Switch } from './ui/switch'

interface DarkModeSwitcherProps extends React.HTMLProps<HTMLDivElement> {
    visible?: boolean
}

const DarkModeSwitcherComponent = React.forwardRef<
    HTMLDivElement,
    DarkModeSwitcherProps
>(({ className, visible = true, ...props }, ref) => {
    // Initialize with system preference
    const [sysMode, setSysMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches
        }
        return false
    })

    useEffect(() => {
        // Get system preference
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

        // Add listener to update styles when system preference changes
        const handleChange = (e: MediaQueryListEvent) => {
            setSysMode(e.matches)
        }

        mediaQuery.addEventListener('change', handleChange)

        // Remove listener on cleanup
        return () => {
            mediaQuery.removeEventListener('change', handleChange)
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

    if (!visible) {
        return null
    }

    return (
        <div className={className} {...props} ref={ref}>
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
})

DarkModeSwitcherComponent.displayName = 'DarkModeSwitcher'

export const DarkModeSwitcher = DarkModeSwitcherComponent
