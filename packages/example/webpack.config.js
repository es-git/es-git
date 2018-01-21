const webpack = require('webpack');
const path = require('path');

const debug = process.env.NODE_ENV !== 'production';

const babelLoader = {
  loader: 'babel-loader',
  query: {
    cacheDirectory: true
  }
};

module.exports = [
  {
    name: 'browser',
    entry: {
      'basic': './ts/basic.ts',
      'fetch': './ts/fetch.ts',
      'push': './ts/push.ts',
      'gitgraph': './ts/gitgraph.ts'
    },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'js')
    },
    devtool: debug ? 'inline-source-map' : 'source-map',
    module: {
      rules: [
        {
          enforce: 'pre',
          test: /\.tsx?$|\.js$/,
          loader: "source-map-loader",
          include: /node_modules/
        },
        {
          test: /\.tsx?$/,
          use: [
            babelLoader,
            'ts-loader',
          ],
          exclude: /node_modules/
        }
      ]
    }
  },
  {
    name: 'server',
    entry: {
      'server': './src/server.js'
    },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname)
    },
    devtool: debug ? 'inline-source-map' : 'source-map',
    target: 'node',
    module: {
      rules: [
        {
          enforce: 'pre',
          test: /\.tsx?$|\.js$/,
          loader: "source-map-loader",
          include: /node_modules/
        },
        {
          test: /\.js?$/,
          use: [
            babelLoader,
          ],
          exclude: /node_modules/
        }
      ]
    }
  }
];
