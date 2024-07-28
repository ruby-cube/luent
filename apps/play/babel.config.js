const presets = [];
const plugins = [
  [
    "@babel/plugin-transform-react-jsx",{ 
      runtime: "automatic", 
      importSource: "../../packages/lumo/jsx-runtime/src" 
    },
  ],
];

module.exports = {
  presets,
  plugins,
};
