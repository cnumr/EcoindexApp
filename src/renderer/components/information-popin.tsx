import { FC, ReactNode } from 'react'

import { Progress } from '../ui/progress'
import { ReloadIcon } from '@radix-ui/react-icons'
import { cn } from '../lib/utils'

export interface ILayout {
    children: ReactNode
    id?: string
    display: boolean
    title: string
    progress?: number
    className?: string
    showSpinner?: boolean
    showProgress?: boolean
    footer?: ReactNode
    isAlert?: boolean
}
export const InformationPopin: FC<ILayout> = ({
    id,
    children,
    display,
    title,
    progress,
    className,
    showSpinner = false,
    showProgress = false,
    footer,
    isAlert = false,
}) => {
    return (
        <div
            id={id}
            className={cn(
                'absolute left-0 top-0 z-10 h-screen w-screen',
                display ? 'block' : 'hidden'
            )}
        >
            <div className="absolute h-full w-full bg-background opacity-70"></div>
            <div className="absolute grid h-full w-full place-content-center">
                <div
                    className={cn(
                        'relative flex flex-col items-center gap-2 rounded-md border border-primary bg-background px-4 py-3 shadow-lg shadow-primary/50',
                        isAlert && 'border-red-500 bg-red-500/10'
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
                    <div className="flex items-start">{children}</div>
                    {showProgress && (
                        <div className="flex items-center">
                            <Progress value={progress} className="h-2 w-full" />
                        </div>
                    )}
                    {footer}
                </div>
            </div>
        </div>
    )
}
