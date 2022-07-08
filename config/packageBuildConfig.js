const path = require('path');

module.exports = {
  entry: './src/package.ts',
  mode: 'production',
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
    path: path.resolve(__dirname, '../build'),
    library: 'ps-engine',
    libraryTarget: 'umd',
    globalObject: 'this',
    umdNamedDefine: true,
  },
  optimization: {
    minimize: true
  },
}