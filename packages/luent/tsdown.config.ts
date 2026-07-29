export default {
  entry: {
    index: 'src/index.ts',
    'jsx-runtime': 'src/jsx-runtime/index.ts',
    'hyper-html': 'src/client/mountHyperHTML.ts'
  },
  format: 'esm',
  outDir: 'dist',
  clean: true,
  deps: {
    // Bundle local workspace packages so npm consumers do not need private @luent/* packages.
    alwaysBundle: [/^@luent\//]
  }
}
