const path = require('path');
const webpack = require('webpack');
const HTMLPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RemovePlugin = require('remove-files-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const {TsConfigPathsPlugin} = require('awesome-typescript-loader');
const HardSourcePlugin = require('hard-source-webpack-plugin');
const GitRevisionPlugin = require('git-revision-webpack-plugin');


module.exports = class Config {
    static get folder() {
        const resolve = (...args) => {
            return path.resolve(__dirname, ...args);
        };

        return {
            src: resolve('src'),
            output: resolve('dist'),
            entry: resolve('src', 'build'),
            static: resolve('src', 'static'),
            pug: resolve('src', 'pug'),
            scss: resolve('src', 'scss'),
            ts: resolve('src', 'ts'),
            hardSourceCache: resolve('.cache'),
            nodeModules: resolve('node_modules')
        };
    }

    /**
     * @see https://github.com/pirelenito/git-revision-webpack-plugin/issues/19#issuecomment-481443028
     */
    static commitHash() {
        // "During Heroku builds, the SOURCE_VERSION and
        // STACK environment variables are set."
        const isOnHeroku = (
            process.env.SOURCE_VERSION &&
            process.env.STACK
        );
        let gitRevisionPlugin = {};

        if (!isOnHeroku) {
            gitRevisionPlugin = new GitRevisionPlugin();
        }

        // "If we're on Heroku, we don't have access to the .git directory so we can't
        // rely on git commands to get the version. What we *do* have during Heroku
        // builds is a SOURCE_VERSION env with the git SHA of the commit being built,
        // so we can use that instead to generate the version file."
        return (
            isOnHeroku ?
            process.env.SOURCE_VERSION :
            gitRevisionPlugin.commithash()
        );
    }

    static config(env) {
        env = env || {};

        const isProduction = (env.NODE_ENV === 'production');
        const HTMLPluginCommonOptions = {
            // plugin options.
            inject: false,

            // custom information.
            isProduction: isProduction,
            nodeEnv: env.NODE_ENV,
            commitHash: this.commitHash(),
            date: Date.now()
        };

        return {
            entry: {
                'index': `${this.folder.entry}/index.js`,
            },
            output: {
                path: this.folder.output
            },
            module: {
                rules: [
                    {
                        test: /\.pug$/,
                        loader: 'pug-loader'
                    },
                    {
                        test: /\.s?(c|a)ss$/,
                        use: [
                            MiniCssExtractPlugin.loader,
                            {
                                loader: 'css-loader',
                                options: {
                                    // we don't need to handle local fonts urls.
                                    url: false
                                }
                            },
                            {
                                loader: 'postcss-loader',
                                options: {
                                    plugins: [
                                        require('autoprefixer')
                                    ]
                                }
                            },
                            'sass-loader'
                        ]
                    },
                    {
                        test: /\.tsx?$/,
                        loader: 'awesome-typescript-loader'
                    },
                    {
                        test: /\.(svg)$/,
                        use: [
                            {
                                loader: 'file-loader',
                                options: {
                                    name: '[name].[ext]',
                                }
                            }
                        ]
                    }
                ]
            },
            plugins: [
                new webpack.DefinePlugin({
                    'process.env': JSON.stringify({
                        buildInfoPlatform: HTMLPluginCommonOptions.platform,
                        buildInfoIsProduction: HTMLPluginCommonOptions.isProduction,
                        buildInfoNodeEnv: env.NODE_ENV,
                        buildInfoCommitHash: HTMLPluginCommonOptions.commitHash,
                        buildInfoDate: HTMLPluginCommonOptions.date
                    })
                }),
                new HardSourcePlugin({
                    cacheDirectory: this.folder.hardSourceCache
                }),
                new RemovePlugin({
                    before: {
                        include: [
                            this.folder.output
                        ]
                    }
                }),
                new CopyPlugin([
                    `${this.folder.static}/favicon`
                ]),
                new MiniCssExtractPlugin({
                    filename: '[name].css'
                }),
                new HTMLPlugin({
                    ...HTMLPluginCommonOptions,
                    template: `${this.folder.pug}/index/_index.pug`,
                    filename: 'index.html',
                })
            ],
            resolve: {
                alias: {
                    '@pug': `${this.folder.pug}`,
                    '@scss': `${this.folder.scss}`,
                    '@ts': `${this.folder.ts}`
                },
                plugins: [
                    /*
                     * 'If you want to use new paths and baseUrl feature of TS 2.0 please include TsConfigPathsPlugin'.
                     * https://github.com/s-panferov/awesome-typescript-loader#advanced-path-resolution-in-typescript-20
                     */
                    new TsConfigPathsPlugin()
                ],
                extensions: [
                    '.html', '.pug',
                    '.css', '.scss',
                    '.js',
                    '.ts', '.d.ts', '.tsx',
                    '.json'
                ]
            },
            externals: {
                /* Direct import. */

                'react': 'React',
                'react-dom': 'ReactDOM'
            }
        }
    }
}
