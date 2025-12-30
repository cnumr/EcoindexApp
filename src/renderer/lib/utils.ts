import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Convert Version to string (shared util safe for renderer and main)
 */
export const convertVersion = (version: string) => {
    return version.replace(/\./gm, '_').replace(/-/gm, '_')
}
