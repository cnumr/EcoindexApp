const config = {
    trailingComma: 'es5',
    tabWidth: 4,
    semi: false,
    singleQuote: true,
    plugins: ['prettier-plugin-tailwindcss'],
    tailwindAttributes: ['myClassList'],
    overrides: [
        {
            files: 'scr/locales/**/*.json',
            options: {
                useTabs: false,
                tabWidth: 2,
            },
        },
    ],
}
export default config
