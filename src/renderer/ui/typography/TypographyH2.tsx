import { cn } from '@/renderer/lib/utils'

export function TypographyH2({
    children,
    className,
}: {
    children?: React.ReactNode
    className?: string
}) {
    return (
        <h2
            className={cn(
                'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
                className
            )}
        >
            {children}
        </h2>
    )
}
