import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default [
    js.configs.recommended,
    prettier,
    {
        ignores: [
            'lib/**',
            'out/**',
            '.vite/**',
            'dist/**',
            'dist-electron/**',
            'node_modules/**',
        ],
    },
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            globals: {
                ...globals.browser,
                ...globals.node,
                process: 'readonly',
            },
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        plugins: {
            react,
            'react-hooks': reactHooks,
            'jsx-a11y': jsxA11y,
            import: importPlugin,
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            ...react.configs.recommended.rules,
            ...react.configs['jsx-runtime'].rules,
            ...reactHooks.configs.recommended.rules,
            ...jsxA11y.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            // Désactivé pour éviter le conflit avec Prettier qui formate à la sauvegarde
            // 'import/order': [
            //     'error',
            //     {
            //         groups: [
            //             'builtin',
            //             'external',
            //             'internal',
            //             'parent',
            //             'sibling',
            //             'index',
            //         ],
            //         'newlines-between': 'always',
            //         alphabetize: {
            //             order: 'asc',
            //             caseInsensitive: true,
            //         },
            //     },
            // ],
            'import/no-unresolved': 'off', // TypeScript gère déjà cela
        },
    },
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            globals: {
                ...globals.browser,
                ...globals.node,
                process: 'readonly',
            },
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        plugins: {
            react,
            'react-hooks': reactHooks,
            '@typescript-eslint': tseslint,
            'jsx-a11y': jsxA11y,
            import: importPlugin,
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            ...react.configs.recommended.rules,
            ...react.configs['jsx-runtime'].rules,
            ...reactHooks.configs.recommended.rules,
            ...jsxA11y.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_' },
            ],
            'no-unused-vars': 'off',
            // Désactivé pour éviter le conflit avec Prettier qui formate à la sauvegarde
            // 'import/order': [
            //     'error',
            //     {
            //         groups: [
            //             'builtin',
            //             'external',
            //             'internal',
            //             'parent',
            //             'sibling',
            //             'index',
            //         ],
            //         'newlines-between': 'always',
            //         alphabetize: {
            //             order: 'asc',
            //             caseInsensitive: true,
            //         },
            //     },
            // ],
            'import/no-unresolved': 'off', // TypeScript gère déjà cela
        },
    },
    {
        // Ignorer toutes les règles d'accessibilité pour les composants Shadcn UI
        // On valide l'accessibilité uniquement lors de l'utilisation dans les interfaces
        files: ['src/components/ui/**/*.tsx'],
        rules: {
            'jsx-a11y/heading-has-content': 'off',
            'jsx-a11y/alt-text': 'off',
            'jsx-a11y/anchor-has-content': 'off',
            'jsx-a11y/anchor-is-valid': 'off',
            'jsx-a11y/aria-activedescendant-has-tabindex': 'off',
            'jsx-a11y/aria-props': 'off',
            'jsx-a11y/aria-proptypes': 'off',
            'jsx-a11y/aria-role': 'off',
            'jsx-a11y/aria-unsupported-elements': 'off',
            'jsx-a11y/autocomplete-valid': 'off',
            'jsx-a11y/click-events-have-key-events': 'off',
            'jsx-a11y/control-has-associated-label': 'off',
            'jsx-a11y/html-has-lang': 'off',
            'jsx-a11y/iframe-has-title': 'off',
            'jsx-a11y/img-redundant-alt': 'off',
            'jsx-a11y/interactive-supports-focus': 'off',
            'jsx-a11y/label-has-associated-control': 'off',
            'jsx-a11y/media-has-caption': 'off',
            'jsx-a11y/mouse-events-have-key-events': 'off',
            'jsx-a11y/no-access-key': 'off',
            'jsx-a11y/no-aria-hidden-on-focusable': 'off',
            'jsx-a11y/no-autofocus': 'off',
            'jsx-a11y/no-distracting-elements': 'off',
            'jsx-a11y/no-interactive-element-to-noninteractive-role': 'off',
            'jsx-a11y/no-noninteractive-element-interactions': 'off',
            'jsx-a11y/no-noninteractive-element-to-interactive-role': 'off',
            'jsx-a11y/no-noninteractive-tabindex': 'off',
            'jsx-a11y/no-redundant-roles': 'off',
            'jsx-a11y/no-static-element-interactions': 'off',
            'jsx-a11y/role-has-required-aria-props': 'off',
            'jsx-a11y/role-supports-aria-props': 'off',
            'jsx-a11y/scope': 'off',
            'jsx-a11y/tabindex-no-positive': 'off',
        },
    },
    {
        files: ['forge.config.js', 'vite.*.config.ts', 'src/main/**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
                process: 'readonly',
                __dirname: 'readonly',
            },
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
    },
    {
        ignores: ['dist/**', '.vite/**', 'out/**', 'node_modules/**', '*.d.ts'],
    },
]
