const webpack = require('webpack');
const path = require('path');

const babelLoader = {
  loader: 'babel-loader',
  query: {
    cacheDirectory: true
  }
};

module.exports = {
  entry: {
    'basic': './ts/basic.ts'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'js')
  },
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
      },
    ]
  }
};
