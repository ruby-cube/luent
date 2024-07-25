const presets = [];
const plugins = [
  [
    "@babel/plugin-transform-react-jsx",
    { runtime: "automatic", importSource: "@rue/jsx-runtime" },
  ],
];

module.exports = {
  presets,
  plugins,
};