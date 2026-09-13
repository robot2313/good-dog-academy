module.exports = ({ config }) => {
  const plugins = (config.plugins ?? []).filter((plugin) => {
    if (typeof plugin === 'string') return plugin !== 'onnxruntime-react-native';
    return true;
  });

  return {
    ...config,
    newArchEnabled: false,
    plugins: [...plugins, './plugins/with-onnxruntime'],
  };
};
