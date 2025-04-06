const path = require('path');

module.exports = {
    mode: 'development', // Switch to 'production' for optimized builds
    entry: './src/public/app.ts',
    output: {
        path: path.resolve(__dirname, 'dist/public'),
        filename: 'app.js',
    },
    target: 'web', // Renderer process runs in a browser-like environment
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    devtool: 'source-map', // For debugging
};