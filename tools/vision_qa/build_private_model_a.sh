#!/usr/bin/env bash
set -euo pipefail

# Local engineering build only. Never publishes an APK or accepts SDK licenses.
# Uses the existing migration's temporary Android-project approach.
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
command -v flutter >/dev/null || { echo 'Flutter 3.47.2 is required.' >&2; exit 1; }
command -v python3 >/dev/null || { echo 'Python with ONNX tooling is required.' >&2; exit 1; }
qa_build_root="$(mktemp -d "${TMPDIR:-/tmp}/gda-model-a.XXXXXX")"
qa_project="$qa_build_root/app"
flutter create --platforms=android --org com.robot2313.migration \
  --project-name good_dog_academy "$qa_project"
cp "$repo_root/flutter_app/pubspec.yaml" "$qa_project/pubspec.yaml"
cp "$repo_root/flutter_app/pubspec.lock" "$qa_project/pubspec.lock"
cp "$repo_root/flutter_app/analysis_options.yaml" "$qa_project/analysis_options.yaml"
# Only remove generated template directories inside the fresh temporary project.
rm -r "$qa_project/lib" "$qa_project/test"
cp -R "$repo_root/flutter_app/lib" "$qa_project/lib"
cp -R "$repo_root/flutter_app/test" "$qa_project/test"
cp -R "$repo_root/flutter_app/assets" "$qa_project/assets"
python3 "$repo_root/tools/vision_qa/provision_model_a.py" \
  --cache "$repo_root/tools/vision_qa/provisioned/model_a" \
  --output "$qa_project/assets/vision-qa-model-a"

python3 - "$qa_project" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
pubspec = p / 'pubspec.yaml'
text = pubspec.read_text()
if '  assets:\n' not in text:
    raise SystemExit('Expected migration Flutter assets section')
pubspec.write_text(text.replace('  assets:\n', '  assets:\n    - assets/vision-qa-model-a/\n', 1))
gradle = p / 'android/app/build.gradle.kts'
text = gradle.read_text()
if 'minSdk = flutter.minSdkVersion' not in text:
    raise SystemExit('Unexpected Android template minSdk')
gradle.write_text(text.replace('minSdk = flutter.minSdkVersion', 'minSdk = 24'))
manifest = p / 'android/app/src/main/AndroidManifest.xml'
text = manifest.read_text()
tag = '<manifest xmlns:android="http://schemas.android.com/apk/res/android">'
if tag not in text or '    <application' not in text:
    raise SystemExit('Unexpected Android manifest template')
permissions = '\n'.join(f'    <uses-permission android:name="android.permission.{name}" />'
                        for name in ['CAMERA', 'RECORD_AUDIO', 'INTERNET']
                        if f'android.permission.{name}' not in text)
text = text.replace(tag, tag + '\n' + permissions, 1)
queries = '<queries>\n' + ''.join(
    f'<intent><action android:name="{name}" /></intent>\n'
    for name in ['android.intent.action.TTS_SERVICE', 'android.speech.RecognitionService']
    if name not in text) + '</queries>\n'
text = text.replace('    <application', queries + '    <application', 1)
manifest.write_text(text)
(p / 'android/app/proguard-rules.pro').write_text('-keep class ai.onnxruntime.** { *; }\n')
PY

cd "$qa_project"
flutter pub get
cmp "$repo_root/flutter_app/pubspec.lock" pubspec.lock
flutter analyze
flutter test
flutter build apk --debug --dart-define=GDA_VISION_QA=true --dart-define=GDA_VISION_MODEL_A=true
printf 'Private QA APK: %s/build/app/outputs/flutter-apk/app-debug.apk\n' "$qa_project"
