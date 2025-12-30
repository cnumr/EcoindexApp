const config = {
    trailingComma: 'es5',
    tabWidth: 4,
    semi: false,
    singleQuote: true,
    plugins: ['prettier-plugin-tailwindcss'],
    tailwindAttributes: ['myClassList'],
    endOfLine: 'lf',
    overrides: [
        {
            files: 'src/locales/**/*.json',
            options: {
                useTabs: false,
                tabWidth: 2,
            },
        },
        {
            files: '.changeset/config.json',
            options: {
                tabWidth: 2,
            },
        },
    ],
}
export default config
