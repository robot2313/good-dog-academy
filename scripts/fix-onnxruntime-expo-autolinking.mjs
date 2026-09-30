import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packageRoot = resolve(process.cwd(), 'node_modules', 'onnxruntime-react-native');
const unimodulePath = resolve(packageRoot, 'unimodule.json');

if (existsSync(unimodulePath)) {
  unlinkSync(unimodulePath);
  console.log('onnxruntime-react-native autolinking fix: removed unimodule.json so Expo can register OnnxruntimePackage.');
} else {
  console.log('onnxruntime-react-native autolinking fix: unimodule.json already absent.');
}

// ONNX links ReactAndroid::reactnative on RN >= 0.76, but its Android library
// excludes only the older split React Native libraries. Exclude its copied
// libreactnative.so as well: the app's react-android dependency supplies it.
// This is library-scoped; do not exclude React Native from the final APK.
const gradlePath = resolve(packageRoot, 'android', 'build.gradle');
const source = readFileSync(gradlePath, 'utf8');
const excludesPattern = /excludes\s*=\s*\[([\s\S]*?)\]/;
const excludes = source.match(excludesPattern);
if (!excludes) {
  throw new Error('ONNX packaging fix: expected Android packaging excludes list was not found; review the installed ONNX version.');
}

if (/["']\*\*\/libreactnative\.so["']/.test(excludes[1])) {
  console.log('onnxruntime-react-native packaging fix: libreactnative.so already excluded from the ONNX library.');
} else {
  const updated = source.replace(excludesPattern, (match) =>
    match.replace('[', '[\n      "**/libreactnative.so",'));
  writeFileSync(gradlePath, updated);
  console.log('onnxruntime-react-native packaging fix: excluded duplicate libreactnative.so from the ONNX library.');
}
