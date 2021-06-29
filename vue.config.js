module.exports = {
    publicPath: '/iWallet',
    configureWebpack: {
        module: {
            rules: [{
                test: /\.json$/,
                //loader: 'json', // yarn add json-loader
            }]
        }
    }
}
