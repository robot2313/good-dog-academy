import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

function expoAutolinkingFindsOnnx() {
  try {
    const output = execFileSync(
      'npx',
      ['expo-modules-autolinking', 'react-native-config', '--platform', 'android', '--json'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const parsed = JSON.parse(output);
    const deps = parsed?.dependencies ?? parsed;
    return Boolean(deps?.['onnxruntime-react-native']);
  } catch (error) {
    console.warn('Could not verify Expo autolinking directly; checking generated MainApplication instead.');
    return false;
  }
}

function findMainApplication(dir) {
  if (!existsSync(dir)) return null;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findMainApplication(path);
      if (found) return found;
    } else if (entry.name === 'MainApplication.kt' || entry.name === 'MainApplication.java') {
      return path;
    }
  }
  return null;
}

const androidRoot = resolve(process.cwd(), 'android');
const mainApplication = findMainApplication(join(androidRoot, 'app', 'src', 'main', 'java'));

if (!mainApplication) {
  throw new Error('ONNX registration check could not find Android MainApplication after Expo prebuild.');
}

let source = readFileSync(mainApplication, 'utf8');
if (source.includes('OnnxruntimePackage')) {
  console.log('ONNX Android registration verified: MainApplication already references OnnxruntimePackage.');
  process.exit(0);
}

if (expoAutolinkingFindsOnnx()) {
  console.log('ONNX Android registration verified through Expo React Native autolinking.');
  process.exit(0);
}

if (mainApplication.endsWith('.kt')) {
  const packageLine = source.match(/^package\s+[^\n]+\n/m)?.[0];
  if (!packageLine) throw new Error('Could not locate Kotlin package declaration in MainApplication.kt.');
  source = source.replace(packageLine, `${packageLine}import ai.onnxruntime.reactnative.OnnxruntimePackage\n`);

  const applyPattern = /PackageList\(this\)\.packages\.apply\s*\{/;
  if (!applyPattern.test(source)) {
    throw new Error('Could not locate PackageList(this).packages.apply block in MainApplication.kt.');
  }
  source = source.replace(applyPattern, (match) => `${match}\n            add(OnnxruntimePackage())`);
} else {
  const packageLine = source.match(/^package\s+[^;]+;\s*\n/m)?.[0];
  if (!packageLine) throw new Error('Could not locate Java package declaration in MainApplication.java.');
  source = source.replace(packageLine, `${packageLine}import ai.onnxruntime.reactnative.OnnxruntimePackage;\n`);

  const packagesPattern = /(List<ReactPackage>\s+packages\s*=\s*new PackageList\(this\)\.getPackages\(\);)/;
  if (!packagesPattern.test(source)) {
    throw new Error('Could not locate PackageList registration in MainApplication.java.');
  }
  source = source.replace(packagesPattern, `$1\n      packages.add(new OnnxruntimePackage());`);
}

writeFileSync(mainApplication, source, 'utf8');
const verified = readFileSync(mainApplication, 'utf8');
if (!verified.includes('OnnxruntimePackage')) {
  throw new Error('ONNX Android registration patch did not persist to MainApplication.');
}

console.log(`ONNX Android registration patched successfully in ${mainApplication}.`);
