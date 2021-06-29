const path = require("path");

module.exports = {
	outputDir: path.resolve(__dirname, "./docs"),
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
