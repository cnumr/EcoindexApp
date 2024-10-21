import type { Configuration } from 'webpack'
import { plugins } from './webpack.plugins'
import { rules } from './webpack.rules'
import webpack from 'webpack'

export const mainConfig: Configuration = {
    /**
     * This is the main entry point for your application, it's the first file
     * that runs in the main process.
     */
    entry: './src/main/main.ts',
    // Put your normal webpack config below here
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
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
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
