import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { verifyOnnxRegistration } from './ensure-onnxruntime-android-registration.mjs';

const require = createRequire(import.meta.url);
const configure = require('../app.config.js');
const main = 'override fun getPackages() = PackageList(this).packages';
const provider = { platforms: { android: {
  packageInstance: 'new OnnxruntimePackage()',
  packageImportPath: 'import ai.onnxruntime.reactnative.OnnxruntimePackage;',
} } };
const autolinking = { dependencies: { 'onnxruntime-react-native': provider } };
const generated = 'return Arrays.asList(new MainReactPackage(), new OnnxruntimePackage());';

test('accepts exactly one automatic registration', () => {
  assert.doesNotThrow(() => verifyOnnxRegistration(main, autolinking, generated));
});

test('rejects the duplicate manual plus autolinked registration from the phone crash', () => {
  assert.throws(() => verifyOnnxRegistration(
    main + '.apply { add(OnnxruntimePackage()) }', autolinking, generated,
  ), /manually registered/);
  assert.throws(() => verifyOnnxRegistration(
    'List<ReactPackage> packages = new PackageList(this).getPackages(); packages.add(new OnnxruntimePackage());',
    autolinking, generated,
  ), /manually registered/);
});

test('rejects a missing or duplicated autolinking provider', () => {
  assert.throws(() => verifyOnnxRegistration(main, { dependencies: {} }), /found 0/);
  assert.throws(() => verifyOnnxRegistration(main, { dependencies: { one: provider, two: provider } }), /found 2/);
});

test('rejects missing or duplicate ONNX instances in the generated Android list', () => {
  assert.throws(() => verifyOnnxRegistration(main, autolinking, 'new MainReactPackage()'), /found 0/);
  assert.throws(() => verifyOnnxRegistration(main, autolinking, generated + 'new OnnxruntimePackage()'), /found 2/);
});

test('requires MainApplication to load automatic packages', () => {
  assert.throws(() => verifyOnnxRegistration('return emptyList()', autolinking, generated), /does not load/);
});

test('removes both forms of the old plugins and preserves local EAS settings', () => {
  const config = { owner: 'ribot', extra: { eas: { projectId: 'local-project' } },
    plugins: ['expo-camera', 'onnxruntime-react-native', ['./plugins/with-onnxruntime', {}],
      ['onnxruntime-react-native', {}], './plugins/with-onnxruntime'] };
  const result = configure({ config });
  assert.deepEqual(result.plugins, ['expo-camera']);
  assert.equal(result.owner, config.owner);
  assert.deepEqual(result.extra, config.extra);
  assert.equal(result.newArchEnabled, false);
});
