// FIX: AI Slop
const { transpileRueScript } = require('@rue/ruescript/transpile')

const FULL_FEATURES = {
  verification: true,
  completion: true,
  semantic: true,
  navigation: true,
  structure: true,
  format: false,
}

function buildIdentityMappings(codeLength) {
  if (codeLength <= 0) {
    return []
  }

  return [{
    sourceOffsets: [0],
    generatedOffsets: [0],
    lengths: [codeLength],
    data: FULL_FEATURES,
  }]
}

function createSnapshot(text) {
  return {
    getText(start, end) {
      return text.slice(start, end)
    },
    getLength() {
      return text.length
    },
    getChangeRange() {
      return undefined
    },
  }
}

function transformRueScriptForLanguageService(source) {
  const compiled = transpileRueScript('virtual.rxs', source)
  if (compiled && typeof compiled.code === 'string') {
    return compiled.code
  }
  return typeof compiled === 'string' ? compiled : source
}

function createRueScriptVirtualCode(fileName, source) {
  const transformed = transformRueScriptForLanguageService(source)
  return {
    id: `${fileName}.tsx`,
    languageId: 'typescriptreact',
    snapshot: createSnapshot(transformed),
    mappings: buildIdentityMappings(source.length),
    embeddedCodes: [],
  }
}

function isRueScriptFile(scriptId) {
  return typeof scriptId === 'string' && scriptId.endsWith('.rxs')
}

function createRueScriptLanguagePlugin(ts) {
  return {
    getLanguageId(scriptId) {
      if (isRueScriptFile(scriptId)) {
        return 'ruescript'
      }
    },
    createVirtualCode(scriptId, languageId, snapshot) {
      if (!isRueScriptFile(scriptId) || languageId !== 'ruescript') {
        return undefined
      }

      const source = snapshot.getText(0, snapshot.getLength())
      return createRueScriptVirtualCode(scriptId, source)
    },
    updateVirtualCode(scriptId, _virtualCode, snapshot) {
      if (!isRueScriptFile(scriptId)) {
        return undefined
      }

      const source = snapshot.getText(0, snapshot.getLength())
      return createRueScriptVirtualCode(scriptId, source)
    },
    typescript: {
      extraFileExtensions: [{
        extension: 'rxs',
        isMixedContent: true,
        scriptKind: ts.ScriptKind.TSX,
      }],
      getServiceScript(root) {
        return {
          code: root,
          extension: '.tsx',
          scriptKind: ts.ScriptKind.TSX,
        }
      },
    },
  }
}

module.exports = {
  createRueScriptLanguagePlugin,
  transformRueScriptForLanguageService,
}
