const path = require('path');

module.exports = {
  entry: './src/index.ts',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(glsl|vs|fs)$/,
        loader: 'shader-loader',
      }
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'ps-engine.js',
    path: path.resolve(__dirname, '../public'),
  },
  optimization: {
    minimize: false
  },
};