'use strict';
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const config = {
  entry: {
    app: ['./src/app.js']
  },
  output: {
    filename: '[name].js',
    hash: true,
    cache: false,
    path: './dist/'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel-loader',
      include: /src/,
      exclude: /tutorial/,
      query: {
        presets: ['es2015']
      }
    }],    
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      cache: false,
      hash: true,
      chunks: ['app']
    })
  ]
};

if (process.argv[1].indexOf('webpack-dev-server') > -1) {
  config.plugins.push(
    new webpack.DefinePlugin({
      environment: JSON.stringify('development')
    })
  );
} else {
  config.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      output: {
        comments: false
      }
    })
  )
  Object.assign(config, {
    devtool: false,
    debug: false,
    cache: false
  });
}

module.exports = config;
