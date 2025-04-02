const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    app: './src/app/app.js', // Adjust path if your JS is in a `src` folder
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    filename: './app/[name].js', // [name] uses entry key (app)
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          'style-loader', // Injects CSS into the DOM
          'css-loader',   // Translates CSS into CommonJS
          'sass-loader'   // Compiles SCSS to CSS
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html', // Adjust path if HTML is in `src`
      filename: 'index.html',
    }),
  ],
};
