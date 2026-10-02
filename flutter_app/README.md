# Good Dog Academy Flutter

This directory is the staged Flutter replacement for the existing React Native / Expo
application. The legacy application remains intact at repository root while migration
is in progress.

## Baseline

Target Flutter: 3.47 stable or newer compatible stable release.
Minimum Dart constraint: 3.12.

## Local bootstrap

Once Flutter is installed, from this directory run:

```bash
flutter create --platforms=android,ios --org com.robot2313 --project-name good_dog_academy .
flutter pub get
flutter analyze
flutter test
```

The committed Dart files and assets are migration source and must be preserved if the
Flutter generator reports existing files.

## Architecture

- lib/app: app shell
- lib/core: theme, routing and infrastructure
- lib/features: feature modules
- lib/features/camera_coach/domain: runtime-neutral Camera Coach contracts
- assets: copied from the verified React Native baseline without recompression

Persistence will use Drift / SQLite.
State management uses Riverpod.
Navigation uses go_router.

The concrete Camera Coach vision runtime is intentionally behind VisionEngine so
model/vendor changes do not force another application rewrite.
