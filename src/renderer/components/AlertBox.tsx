import { AlertCircle, Bug, RocketIcon } from 'lucide-react'
import { FC, ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'

interface ILayout {
    children?: ReactNode | string
    variant?: 'destructive' | 'default' | 'bug'
    title: string
}

export const AlertBox: FC<ILayout> = ({
    children,
    title,
    variant = 'destructive',
}) => {
    // Convertir 'bug' en 'destructive' pour le composant Alert
    const alertVariant: 'default' | 'destructive' =
        variant === 'bug' ? 'destructive' : variant
    return (
        <Alert
            variant={alertVariant}
            className="bg-card dark:text-card-foreground"
        >
            {variant === 'destructive' && <AlertCircle className="size-4" />}
            {variant === 'default' && <RocketIcon className="size-4" />}
            {variant === 'bug' && <Bug className="size-4" />}
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{children}</AlertDescription>
        </Alert>
    )
}
