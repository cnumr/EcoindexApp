import { useRef, useCallback } from 'react'
import packageJson from '../../../../package.json'
import log from 'electron-log/renderer'

const frontLog = log.scope('front/App/useAppUtils')

export function useAppUtils() {
    const timeOutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    /**
     * Utils, wait method.
     * @param {number} ms Milisecond of the timer.
     * @param {boolean} clear clear and stop the timer.
     * @returns Promise<unknown>
     */
    const sleep = useCallback(
        async (ms: number, clear = false): Promise<void> => {
            if (clear) {
                frontLog.debug(`sleep cleared.`)
                if (timeOutRef.current) {
                    clearTimeout(timeOutRef.current)
                    timeOutRef.current = null
                }
                return
            }
            return new Promise<void>((resolve) => {
                frontLog.debug(`wait ${ms / 1000}s`)
                if (timeOutRef.current) {
                    clearTimeout(timeOutRef.current)
                    frontLog.debug(`sleep reseted.`)
                }
                timeOutRef.current = setTimeout(() => resolve(), ms)
            })
        },
        []
    )

    /**
     * Notify user.
     * @param title string
     * @param options any
     */
    const showNotification = useCallback((title: string, options: any) => {
        const _t = title === '' ? packageJson.productName : title
        new window.Notification(_t, options)
    }, [])

    /**
     * Necessary display waiting popin.
     * @param block boolean
     */
    const blockScrolling = useCallback((block = true) => {
        const body = document.getElementsByTagName(
            `body`
        )[0] as unknown as HTMLBodyElement
        body.style.overflowY = block ? 'hidden' : 'auto'
    }, [])

    /**
     * Show/Hide waiting popin during process.
     * @param value string | boolean
     */
    const showHidePopinDuringProcess = async (
        value: string | boolean,
        setPopinText: (text: string) => void,
        setDisplayPopin: (display: boolean) => void
    ) => {
        if (typeof value === 'string') {
            setPopinText(value)
            setDisplayPopin(true)
            blockScrolling(true)
            window.scrollTo(0, 0)
        } else if (value === true) {
            setPopinText(`Done 🎉`)
            await sleep(2000)
            setDisplayPopin(false)
            blockScrolling(false)
        } else {
            setPopinText(`Error 🚫`)
            await sleep(4000)
            setDisplayPopin(false)
            blockScrolling(false)
        }
    }

    return {
        sleep,
        showNotification,
        blockScrolling,
        showHidePopinDuringProcess,
    }
}
