import { FC, ReactNode } from 'react'

import { ReloadIcon } from '@radix-ui/react-icons'
import { cn } from '@/renderer/lib/utils'

export interface InformationPopinProps {
    children: ReactNode
    id?: string
    display: boolean
    title: string
    className?: string
    showSpinner?: boolean
    footer?: ReactNode
    isAlert?: boolean
    errorLink?: {
        label: string
        url: string
    }
}

export const InformationPopin: FC<InformationPopinProps> = ({
    id,
    children,
    display,
    title,
    className,
    showSpinner = false,
    footer,
    errorLink: _errorLink,
    isAlert = false,
}) => {
    if (!display) return null

    return (
        <div id={id} className="fixed left-0 top-0 z-50 h-screen w-screen">
            <div className="absolute h-full w-full bg-background/70"></div>
            <div className="absolute grid h-full w-full place-content-center p-4">
                <div
                    className={cn(
                        'relative flex w-full min-w-[300px] max-w-[600px] flex-col items-center gap-2 rounded-md border border-primary bg-background px-6 py-4 shadow-lg shadow-primary/50',
                        isAlert && 'border-red-500 bg-red-500/10',
                        className
                    )}
                >
                    <div
                        className={cn(
                            'flex items-center font-black',
                            isAlert ? '!text-red-500' : '!text-primary',
                            className
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <span>{title}</span>
                            {showSpinner && (
                                <ReloadIcon className="mr-2 size-4 animate-spin" />
                            )}
                        </div>
                    </div>
                    <div className="flex w-full flex-col items-center text-center">
                        {children}
                    </div>
                    {footer}
                </div>
            </div>
        </div>
    )
}
