const { createLanguageServicePlugin } = require('@volar/typescript/lib/quickstart/createLanguageServicePlugin')
const { createRueScriptLanguagePlugin } = require('@rue/ruescript-language-service')

module.exports = createLanguageServicePlugin((ts) => {
  return {
    languagePlugins: [
      createRueScriptLanguagePlugin(ts),
    ],
  }
})
