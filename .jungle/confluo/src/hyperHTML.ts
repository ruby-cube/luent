import { traverse } from '@luent/tree-squirl';
import { Argument, Node, parseSync, Program } from 'oxc-parser';
import { PluginOption } from 'vite';

// NOTE: abandoning this implementation. See https://chatgpt.com/share/6a5159dc-d2a4-83e8-bfe3-bfe5018e1e54

export default function hyperHTMLPlugin() {
  let htmlOutputs = new Map()

  const plugin: PluginOption = {
    name: "hyper-html-plugin",
    enforce: 'pre',

    transform(code, id) {
      if (!id.endsWith(".tsx")) return;
      if (!hasHyperHTML(code)) return;

      const output = processHyperHTML(code, id)
      if (!output) return;
      const { transformed } = output
      htmlOutputs.set(id, transformed.html)

      return transformed.tsx
    },

    // called in build
    generateBundle(_, bundle) {
      for (const [path, html] of htmlOutputs) {
        this.emitFile({
          type: "asset",
          fileName: path,
          source: html
        })
      }
    },

    // dev mode: serve virtual HTML
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (htmlOutputs.has(req.url)) {
          res.setHeader("Content-Type", "text/html")
          res.end(htmlOutputs.get(req.url))
          return
        }
        next()
      })
    }
  }
  return plugin;
}


function hasHyperHTML(code: string) {
  if (!code.includes('luent/hyper-html')) return false;
  const callIndex = code.indexOf('mountHyperHTML(') // NOTE: Currently assumes `mountHyperHTML` is never reassigned to an alias.
  if (callIndex === -1) return false;
  const importIndex = code.indexOf('mountHyperHTML')
  if (importIndex === callIndex) return false;
  return true;
}


function processHyperHTML(code: string, file: string) {
  const { program } = parseTSX(file, code)
  const transformed = transformTSX(program);
  const html = transformHTML(extractJSXTree(program))

  return {
    source: code,
    transformed: {
      tsx: transformed,
      html
    }
  }
}

function parseTSX(file: string, code: string) {
  return parseSync(file, code, {
    astType: 'ts',
    lang: 'tsx',
    preserveParens: true,
    sourceType: 'module'
  })
}

function transformTSX(ast: Node) {

}

function extractJSXTree(ast: Node) {
  // TODO: 
  // - verify mountHyperHTML imported from luent/hyper-html
  // - aliasing
  // - reassignment
  // - top-level call requirement

  let found = false;
  traverse(ast, {}, {
    CallExpression(node) {
      if (node.callee.type !== 'Identifier') return;
      if (node.callee.name !== 'mountHyperHTML') return;
      if (found) throw new Error('mountHyperHTML may only be called once per file')
      found = true;
      const filename = extractFilename(node.arguments[0])
      const jsxTree = extractJSX(node.arguments[1])
    }
  })
  function extractFilename(node: Argument) {
    if (node.type !== 'Literal') throw new TypeError('filename must be a string');
    return node.value
  }
  function extractJSX(node: Argument) {
    if (node.type !== 'JSXElement') throw new TypeError('jsx must be a string');

  }
}


function transformHTML(ast: Node) {

}