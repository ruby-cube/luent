import { parseSync } from 'oxc-parser';
import { printTSX } from '@rue/nextscript';

export default function hyperHTMLPlugin() {
  let htmlOutputs = new Map()

  /** @type {import('vite').PluginOption} */
  const plugin = {
    name: "hyper-html-plugin",
    enforce: 'pre',

    transform(code, id) {
      if (!id.endsWith(".tsx")) return;
      if (!hasHyperHTML(code)) return;

      const output = processHyperHTML(code)
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

function hasHyperHTML(code) {
  if (!code.includes('@rue/luent/hyper-html')) return false;
  const callIndex = code.indexOf('mountHyperHTML(')
  if (callIndex === -1) return false;
  const importIndex = code.indexOf('mountHyperHTML')
  if (importIndex === callIndex) return false;
  return true;
}

function processHyperHTML(code) {
  const tree = parseTSX(code)
  const newTree = transformTSX(tree.program);
  const generated = printTSX(newTree)
  const html = printHTML(extractJSXTree(tree))

  return {
    source: code,
    transformed: {
      tsx: generated,
      html
    }
  }
}

function parseTSX(file, code) {
  return parseSync(file, code, {
    astType: 'ts',
    lang: 'tsx',
    preserveParens: true,
    sourceType: 'module'
  })
}

function transformTSX(ast) {

}

function extractJSXTree(tree) {
  
}

function printHTML(tree) {

}