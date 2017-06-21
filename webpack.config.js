try { //Win10 Bash Fix
  require('os').networkInterfaces()
} catch (e) {
  require('os').networkInterfaces = () => ({})
}

const { resolve } = require('path');
const webpack = require('webpack');
const fs = require('fs');

module.exports = {
  entry: {
    'statex': [
      'webpack-dev-server/client?http://localhost:8080',
      'webpack/hot/only-dev-server',
      './example/index.js'
    ],
  },
  output: {
    filename: '[name].js',
    path: resolve(__dirname, 'dist'),
    publicPath: resolve(__dirname, 'dist'),
  },
  context: resolve(__dirname, 'src'),
  devtool: 'inline-source-map',
  devServer: {
    hot: true,
    contentBase: resolve(__dirname, 'statics'),
    publicPath: '/',
    host: 'localhost',
    port: 8080,
    historyApiFallback: true
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: [ 'babel-loader' ],
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(true)
    })
  ],
  resolve: {
    modules: [ resolve(__dirname, 'src'), 'node_modules' ],
    extensions: [ '.js', '.jsx', '.json' ]
  }
};