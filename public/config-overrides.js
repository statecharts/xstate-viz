const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = function override(config, env) {
  return {
    ...config,
    plugins: [
      ...config.plugins,
      new MonacoWebpackPlugin({
        languages: ['javascript', 'typescript']
      })
    ]
  };
};
