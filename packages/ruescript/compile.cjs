function transformForTypeScript(source) {
  let transformed = source

  transformed = transformed.replace(
    /\bget((?:[ \t]|\/\*[\s\S]*?\*\/)+)([A-Za-z_$][\w$]*)((?:[ \t]|\/\*[\s\S]*?\*\/)*)(?==(?![=>]))/g,
    (_match, gap, identifier, postGap) => `let${gap}${identifier}${postGap}`,
  )

  transformed = transformed.replace(
    /\bget((?:[ \t]|\/\*[\s\S]*?\*\/)+)([A-Za-z_$][\w$]*)((?:[ \t]|\/\*[\s\S]*?\*\/)*)(?=:)/g,
    (_match, gap, identifier, postGap) => `${' '.repeat(3 + gap.length)}${identifier}${postGap}`,
  )

  return transformed
}

function compileRueScript(_file, source) {
  return {
    code: transformForTypeScript(source),
  }
}

module.exports = {
  compileRueScript,
}
