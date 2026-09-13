module.exports = ({ config }) => {
  const plugins = (config.plugins ?? []).filter((plugin) => {
    if (typeof plugin === 'string') return plugin !== 'onnxruntime-react-native';
    return true;
  });

  return {
    ...config,
    plugins: [...plugins, './plugins/with-onnxruntime'],
  };
};
