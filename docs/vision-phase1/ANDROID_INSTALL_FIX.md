# Camera Phase 1 Android installation isolation

Roger's 2026-10-08 screenshot confirms that the correct 308 MB Phase 1 APK is rejected with an existing-package conflict. The screenshot does not distinguish a signing-certificate mismatch, a version downgrade, or another installed-package incompatibility. Do not claim the exact underlying cause without Package Manager/ADB evidence.

This is verified installation/build infrastructure work required to unblock the Phase 1 physical benchmark. Starting branch: `work/flutter-camera-phase1`, head `cd70c6db899e4ce9c4270c752049f0937e571f26`. Main remains untouched.

The private QA build now uses:

- Application ID: `com.robot2313.migration.good_dog_academy.qa.camera_phase1`
- Launcher/installer label: **GDA Camera Phase 1 QA**
- Previous QA ID retained in older APKs: `com.robot2313.migration.good_dog_academy.qa`

This makes Phase 1 a separate Android application, avoiding an attempted update of the older QA installation. Existing apps and their saved data are preserved. The new app starts with its own identity/onboarding and QA storage. It does not copy private app data between packages.

Only the QA build workflow and recipient certificate change. Vision source, model weights/hashes, benchmark results, Dart dependencies and consumer build identity stay unchanged. The certificate protects the private artifact transfer; it is distinct from the Android app-signing certificate. The renewed transfer private key stays outside Git and is never uploaded. Debug signing continues to use the existing CI key cache.

Before artifact publication CI runs Flutter analysis, the full suite, asset provisioning/verification, Android compilation, and a new native APK verification step using `aapt` and `apksigner`. The step rejects the wrong application ID/label/API, invalid signature, missing private model gates or changed model hashes. The plaintext APK remains excluded from public GitHub artifacts; the encrypted artifact is decrypted and delivered privately.

Local verification exercises the actual workflow configuration script on generated-project-shaped inputs in both normal and private modes, parses the workflow YAML and compiles its embedded Python. Final evidence must come from the real CI-produced APK. A physical phone install remains Roger's check; do not claim it has happened until confirmed.

Installation: download **GDA-Camera-Phase1-InstallFix.apk**, open it in Android My Files, and check the installer says **GDA Camera Phase 1 QA**. Open that newly named app, select/create the dog, then use the flask button, Improved A and Start new QA session. No uninstall of existing Good Dog Academy apps is needed.

Next dependency remains the physical dog-camera benchmark. This installation fix makes no new accuracy claims.
