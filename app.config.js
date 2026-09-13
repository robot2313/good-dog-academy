module.exports = ({ config }) => {
  // postinstall makes ONNX discoverable by Expo autolinking. Adding it again
  // through MainApplication causes a duplicate native module at startup.
  const plugins = (config.plugins ?? []).filter((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    return name !== 'onnxruntime-react-native' && name !== './plugins/with-onnxruntime';
  });

  return {
    ...config,
    newArchEnabled: false,
    plugins,
  };
};
