import { defineConfig } from 'vite'

// https://vitejs.dev/config
export default defineConfig({
    build: {
        lib: {
            entry: 'src/main/main.ts',
            formats: ['es'],
            fileName: () => 'main.js',
        },
        rollupOptions: {
            external: ['electron', 'electron-squirrel-startup'],
        },
    },
    resolve: {
        // Some libs that can run in both Node and Browser doesn't provide browser build
        // So we need to manually specify the resolve conditions
        conditions: ['node', 'default'],
    },
})
