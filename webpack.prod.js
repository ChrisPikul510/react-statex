try { //Win10 Bash Fix
  require('os').networkInterfaces()
} catch (e) {
  require('os').networkInterfaces = () => ({})
}

const { resolve } = require('path');
const webpack = require('webpack');
const fs = require('fs');

module.exports = {
  entry: './index.js',
  output: {
    filename: 'index.js',
    path: resolve(__dirname, 'lib'),
    library: 'react-statex',
    libraryTarget: 'commonjs2',
    umdNamedDefine: true
  },
  context: resolve(__dirname, 'src'),
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: [ 'babel-loader' ],
        exclude: /node_modules/
      }
    ]
  },
  externals: {
    'react': 'react',
    'react-dom' : 'reactDOM' 
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(false)
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      comments: false,
      compress: {
        warnings: false,
        drop_console: false,
      }
    })
  ],
  resolve: {
    modules: [ resolve(__dirname, 'src'), 'node_modules' ],
    extensions: [ '.js', '.jsx', '.json' ]
  }
};