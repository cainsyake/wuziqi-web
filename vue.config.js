// eslint-disable-next-line @typescript-eslint/no-var-requires
// const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const fs = require('fs')
// const argv = require('optimist').argv
//
// const resolve = dir => {
//   return path.join(__dirname, dir)
// }
//
// const serverPort = argv.serverPort || '11250'
// process.env.VUE_APP_SERVER_PORT = serverPort
//
// const env = process.env.NODE_ENV || 'development'
// fs.writeFileSync(path.join(__dirname, './config/env.js'), `export default '${env}'\n`)
//
// function addStyleResource(rule) {
//   rule
//     .use('style-resource')
//     .loader('style-resources-loader')
//     .options({
//       patterns: [path.resolve(__dirname, './src/style/commonVar.styl')],
//     })
// }

module.exports = {
  // chainWebpack: config => {
  //   // 配置自动导入公共样式文件
  //   const types = ['vue-modules', 'vue', 'normal-modules', 'normal']
  //   types.forEach(type => addStyleResource(config.module.rule('stylus').oneOf(type)))
  //
  //   config.plugin('html').tap(args => {
  //     args[0].title = 'InCloud Video'
  //     return args
  //   })
  // },
  devServer: {
    disableHostCheck: true,
  },
}
