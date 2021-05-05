const HtmlWebpackPlugin = require("html-webpack-plugin");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")
const path = require("path");

module.exports = {

    mode: "development",

    entry: ["@babel/polyfill", "./src/app.js"],

    output: {
        path: path.resolve(__dirname, "./dist"),
        filename: "bundle.js"
    },

    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },

    plugins: [
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: 'index.html'
        }),
        new NodePolyfillPlugin()
    ],


    devtool: "source-map",
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        compress: true,
        port: 8080
    }
};