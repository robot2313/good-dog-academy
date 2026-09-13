const { withMainApplication } = require('@expo/config-plugins');

function addOnnxruntimePackageToKotlin(source) {
  if (source.includes('OnnxruntimePackage()')) return source;

  if (!source.includes('import ai.onnxruntime.reactnative.OnnxruntimePackage')) {
    const packageLine = source.match(/^package\s+[^\n]+\n/m)?.[0];
    if (!packageLine) {
      throw new Error('with-onnxruntime: could not locate Kotlin package declaration in MainApplication.kt');
    }
    source = source.replace(
      packageLine,
      `${packageLine}\nimport ai.onnxruntime.reactnative.OnnxruntimePackage\n`,
    );
  }

  const applyPattern = /PackageList\(this\)\.packages\.apply\s*\{/;
  if (!applyPattern.test(source)) {
    throw new Error('with-onnxruntime: could not locate PackageList(this).packages.apply block in MainApplication.kt');
  }

  return source.replace(
    applyPattern,
    (match) => `${match}\n              add(OnnxruntimePackage())`,
  );
}

function addOnnxruntimePackageToJava(source) {
  if (source.includes('new OnnxruntimePackage()')) return source;

  if (!source.includes('import ai.onnxruntime.reactnative.OnnxruntimePackage;')) {
    const packageLine = source.match(/^package\s+[^;]+;\s*\n/m)?.[0];
    if (!packageLine) {
      throw new Error('with-onnxruntime: could not locate Java package declaration in MainApplication.java');
    }
    source = source.replace(
      packageLine,
      `${packageLine}\nimport ai.onnxruntime.reactnative.OnnxruntimePackage;\n`,
    );
  }

  const packagesPattern = /(List<ReactPackage>\s+packages\s*=\s*new PackageList\(this\)\.getPackages\(\);)/;
  if (!packagesPattern.test(source)) {
    throw new Error('with-onnxruntime: could not locate PackageList registration in MainApplication.java');
  }

  return source.replace(
    packagesPattern,
    `$1\n      packages.add(new OnnxruntimePackage());`,
  );
}

module.exports = function withOnnxruntime(config) {
  return withMainApplication(config, (configWithMainApplication) => {
    const mainApplication = configWithMainApplication.modResults;
    const source = mainApplication.contents;

    mainApplication.contents = mainApplication.language === 'java'
      ? addOnnxruntimePackageToJava(source)
      : addOnnxruntimePackageToKotlin(source);

    return configWithMainApplication;
  });
};
