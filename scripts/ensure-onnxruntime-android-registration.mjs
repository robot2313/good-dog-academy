import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

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

export function verifyOnnxRegistration(mainSource, autolinking, packageListSource) {
  // Autolinking is the single registration owner. Fail on stale native sources
  // too, since EAS skips prebuild when an android directory is uploaded.
  const source = mainSource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  if (/\bOnnxruntimePackage\b/.test(source)) {
    throw new Error('ONNX is manually registered in MainApplication. Regenerate Android sources; use autolinking only.');
  }
  if (!/\bPackageList\s*\(/.test(source)) {
    throw new Error('MainApplication does not load the autolinked PackageList.');
  }

  const providers = Object.values(autolinking.dependencies ?? {}).filter((dependency) => {
    const android = dependency.platforms?.android;
    return android && /\bOnnxruntimePackage\b/.test(android.packageInstance ?? '');
  });
  if (providers.length !== 1) {
    throw new Error(`Expected exactly one autolinked ONNX provider, found ${providers.length}.`);
  }
  if (!providers[0].platforms.android.packageImportPath?.includes('ai.onnxruntime.reactnative.OnnxruntimePackage')) {
    throw new Error('ONNX autolinking resolved an unexpected package import.');
  }

  if (packageListSource !== undefined) {
    const instances = packageListSource.match(/\bnew\s+(?:ai\.onnxruntime\.reactnative\.)?OnnxruntimePackage\s*\(/g) ?? [];
    if (instances.length !== 1) {
      throw new Error(`Generated PackageList must register ONNX exactly once; found ${instances.length}.`);
    }
  }
}

function main() {
  const androidRoot = resolve(process.cwd(), 'android');
  const mainApplication = findMainApplication(join(androidRoot, 'app', 'src', 'main', 'java'));
  if (!mainApplication) {
    throw new Error('ONNX verification could not find Android MainApplication after Expo prebuild.');
  }

  const cli = require.resolve('expo-modules-autolinking/bin/expo-modules-autolinking.js');
  const autolinking = JSON.parse(execFileSync(process.execPath, [
    cli, 'react-native-config', '--platform', 'android', '--json',
  ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }));

  let packageListSource;
  if (process.argv.includes('--after-build')) {
    const packageList = join(androidRoot, 'app', 'build', 'generated', 'autolinking', 'src', 'main', 'java', 'com', 'facebook', 'react', 'PackageList.java');
    packageListSource = readFileSync(packageList, 'utf8');
  }
  verifyOnnxRegistration(readFileSync(mainApplication, 'utf8'), autolinking, packageListSource);
  console.log(packageListSource === undefined
    ? 'ONNX registration VERIFIED: one autolinking provider, no manual registration.'
    : 'ONNX registration VERIFIED: generated Android PackageList registers ONNX exactly once.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
