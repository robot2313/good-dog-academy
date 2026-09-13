import { existsSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const unimodulePath = resolve(
  process.cwd(),
  'node_modules',
  'onnxruntime-react-native',
  'unimodule.json',
);

if (!existsSync(unimodulePath)) {
  console.log('onnxruntime-react-native autolinking fix: unimodule.json already absent.');
  process.exit(0);
}

unlinkSync(unimodulePath);
console.log('onnxruntime-react-native autolinking fix: removed unimodule.json so Expo can register OnnxruntimePackage.');
