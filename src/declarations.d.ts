declare module '*.svg' {
    const content: string
    export default content
}
declare module 'src/shared/tailwind-helper' {
    export function cn(...classes: string[]): string
}
declare module '*.md'
declare module 'lighthouse-plugin-ecoindex/install-browser.cjs'
declare module 'lighthouse-plugin-ecoindex/run.cjs' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export default function runCourses(cliFlags: any): Promise<void>
}
declare module 'lighthouse-plugin-ecoindex/cli/index.mjs' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export default function begin(): Promise<void>
}
// declare module '../../../node_modules/lighthouse-plugin-ecoindex/run.cjs'

// declare module '*.css';
// declare module '*.png';
// declare module '*.jpg';
// declare module '*.jpeg';
