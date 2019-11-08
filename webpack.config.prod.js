const webpack = require('webpack');
const merge = require('webpack-merge');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');


module.exports = function(env) {
    env = env || {};
    env.NODE_ENV = 'production';

    const commonConfig = require('./webpack.config.common');

    return merge(commonConfig.config(env), {
        mode: env.NODE_ENV,
        devtool: 'nosources-source-map',
        output: {
            filename: '[name].js',
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV)
            }),
            new OptimizeCssAssetsPlugin()
        ]
    });
}
