export default {
  entry: {
    index: 'src/index.ts',
    'client/index': 'src/client/index.ts',
    'server/index': 'src/server/index.ts',
    'jsx-runtime': 'src/jsx-runtime/index.ts'
  },
  tsconfig: 'tsconfig.tsdown.json',
  dts: false,
  format: 'esm',
  outDir: 'dist',
  clean: true,
  define: {
    __INTERNAL__: 'false'
  },
  deps: {
    // Bundle local workspace packages so npm consumers do not need private @luently/* packages.
    alwaysBundle: [/^@luently\//]
  }
}
