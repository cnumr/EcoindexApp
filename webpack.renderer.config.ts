import type { Configuration } from 'webpack'
import path from 'path'
import { plugins } from './webpack.plugins'
import { resolveTsAliases } from 'resolve-ts-aliases'
import { rules } from './webpack.rules'
import webpack from 'webpack'

rules.push(
    {
        test: /\.css$/,
        use: [
            { loader: 'style-loader' },
            { loader: 'css-loader' },
            { loader: 'postcss-loader' },
        ],
    },
    {
        test: /\.md$/,
        use: 'raw-loader',
    }
)

export const rendererConfig: Configuration = {
    module: {
        rules,
    },
    plugins: [
        ...plugins,
        new webpack.NormalModuleReplacementPlugin(
            /node:url/,
            require.resolve('url/')
        ),
    ],
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
        alias: {
            ...resolveTsAliases(path.resolve('tsconfig.json')),
            path: require.resolve('path-browserify'),
        },
        fallback: {
            fs: false,
            path: require.resolve('path-browserify'),
            url: require.resolve('url/'),
        },
    },
    externals: {
        'lighthouse': 'commonjs lighthouse',
        'lighthouse-plugin-ecoindex': 'commonjs lighthouse-plugin-ecoindex',
    },
}
