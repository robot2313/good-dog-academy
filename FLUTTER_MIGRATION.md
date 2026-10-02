# Good Dog Academy — Flutter Migration Contract

Date started: 2026-10-02

## Verified source baseline

- Repository: robot2313/good-dog-academy
- Source branch: feature/adaptive-training-port
- Source commit: 33e34f43a098a5ec39117e3d756922e9a1bb99b7
- Migration branch: migration/flutter-trainer-pocket
- main is not modified by this migration.
- Existing React Native / Expo code remains in the repository during migration as the reference implementation and rollback path.

## Product goal

Migrate Good Dog Academy to Flutter without discarding the product work already completed.

The target product remains:

WATCH -> UNDERSTAND -> COACH -> REMEMBER -> ADAPT

Camera Coach is a core product capability, not a standalone demo.

## Preserve

The migration must preserve, unless a later verified decision explicitly changes them:

- all active lesson IDs and lesson content
- all committed lesson photography and step imagery
- onboarding and dog identity
- behaviour assessment
- progress and session history concepts
- Daily Plan and adaptive recommendation behaviour
- Troubleshooter / Help Me Now
- reward-based, force-free safety rules
- Camera Coach coaching and rep-state concepts
- trainer voice experience
- current visual identity and approved reference geometry
- data deletion and privacy behaviour

## Replace

The following implementation layers are intentionally replaced:

- React Native UI -> Flutter UI
- React Navigation -> go_router
- React contexts -> Riverpod application state
- AsyncStorage persistence -> Drift / SQLite transactional persistence
- Expo image picking -> Flutter image_picker
- Expo speech -> native Flutter speech-to-text and TTS plugins
- Expo / React Native camera-inference bridge -> Flutter/native vision runtime

## Vision architecture

The Flutter application must depend on a vendor-neutral VisionEngine interface.

Camera -> detection -> tracking -> dog ROI -> dog pose -> temporal smoothing ->
behaviour classification -> rep state machine -> coaching -> training evidence ->
memory / adaptation

The application domain must not depend directly on one model vendor.

Ultralytics' Flutter plugin is suitable for R&D because it currently supports live
Android/iOS detection and pose inference. It is AGPL-3.0 and advertises a commercial
Enterprise License, so it must not become an unreviewed production dependency.
Commercial licensing must be resolved before release if that runtime is used.

## Persistence

New Flutter persistence uses SQLite through Drift. Existing schema-v5 user data must
not be silently abandoned. A one-time migration/import strategy must be implemented
and tested before the Flutter app replaces the React Native build for existing users.

## Migration sequence

1. Foundation: Flutter package, routing, theme, state boundaries, copied assets.
2. Content: port immutable lesson catalogue and verify permanent IDs/counts.
3. Core data: port domain models, validation, repositories and transactions to Drift.
4. Product flows: onboarding, assessment, home, categories, journey, progress,
   lesson detail, guided sessions, troubleshooter and privacy.
5. Adaptation: Daily Plan, training evidence, skill scoring and recommendations.
6. Camera Coach shell: camera UX, framing, voice and coaching state machine.
7. Vision engine: detection, tracking, dog pose, temporal behaviour recognition.
8. Advanced behaviours: stay, recall, heel position, loose lead and likely pulling.
9. Legacy-data import and parity validation.
10. Store/release validation and only then consider cutover.

## Cutover gates

The React Native app remains the reference until Flutter demonstrates:

- 60 active lessons with the same permanent IDs
- image parity for every lesson and available step image
- navigation and critical screen parity
- deterministic assessment parity
- progress/session persistence
- Daily Plan/adaptive parity
- privacy and delete-all-data behaviour
- Camera Coach functional equivalence or improvement
- Android physical-device testing
- iOS physical-device testing
- green Flutter analyze/test/build checks
- a tested upgrade path for existing local data

Do not delete the legacy implementation simply because an equivalent Flutter screen
has been started.
