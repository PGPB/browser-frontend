const webpack = require('webpack');
const merge = require('webpack-merge');


module.exports = function(env) {
    env = env || {};
    env.NODE_ENV = 'development';

    const commonConfig = require('./webpack.config.common');

    return merge(commonConfig.config(env), {
        entry: {},
        mode: env.NODE_ENV,
        devtool: 'eval-source-map',
        output: {
            filename: '[name].js'
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV)
            })
        ]
    });
}
