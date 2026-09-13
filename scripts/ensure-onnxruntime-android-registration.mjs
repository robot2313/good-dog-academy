import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

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
  throw new Error('ONNX verification could not find Android MainApplication after Expo prebuild.');
}

const source = readFileSync(mainApplication, 'utf8');
const hasImport = source.includes('ai.onnxruntime.reactnative.OnnxruntimePackage');
const hasInstance = source.includes('OnnxruntimePackage()') || source.includes('new OnnxruntimePackage()');

if (!hasImport || !hasInstance) {
  throw new Error(
    `ONNX native registration missing from ${mainApplication}. ` +
    `Expected both the OnnxruntimePackage import and package instance.`,
  );
}

console.log(`ONNX native registration VERIFIED in ${mainApplication}.`);
