const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/public/app.ts',
    output: {
        path: path.resolve(__dirname, 'dist/public'),
        filename: 'app.js',
    },
    target: 'web',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.html$/,
                use: 'html-loader',
            },
            {
                test: /\.scss$/,
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    devtool: 'source-map',
};