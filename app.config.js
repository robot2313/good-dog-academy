const appJson = require('./app.json');

module.exports = () => {
  const base = appJson.expo ?? appJson;
  const plugins = (base.plugins ?? []).filter((plugin) => {
    if (typeof plugin === 'string') return plugin !== 'onnxruntime-react-native';
    return true;
  });

  return {
    expo: {
      ...base,
      plugins: [...plugins, './plugins/with-onnxruntime'],
    },
  };
};
