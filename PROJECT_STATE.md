# Good Dog Academy — Project State

## Current checkpoint

**Milestone 10 implementation is committed and pushed on `feature/milestone-10-release-readiness` at `0748023`. Milestone 10.1 release-candidate preparation is now in progress.**

The warm editorial redesign and expanded adaptive Training Troubleshooter have received an Expo Go visual approval on a physical device. The complete destructive-data and relaunch smoke-test gate is still pending.

## Completed product experience

- Local Owner and Dog onboarding with optional managed dog photo
- Deterministic behaviour assessment and personalised training plan
- Thirty immutable reward-based lessons with search, filters, prerequisites, and journey states
- Guided lesson sessions, completion persistence, session history, and progress views
- Warm bone, forest, sage, and clay visual system with selected-dog identity and production lesson photography
- Adaptive Training Troubleshooter with thirteen topics, safety overrides, immediate exercises, fallback levels, saved outcomes, and a practical reference guide

## Milestone 10 completed

- Permanent iOS and Android identity: `com.robot2313.gooddogacademy`
- Production app icon, adaptive icon, and splash branding
- Explicit removal of unused microphone permission
- EAS internal-preview and production build profiles
- In-app privacy disclosure using `GoodDogAcademy1@gmail.com`
- Confirmed production deletion of every registered app storage key and managed dog-photo directory
- Atomic rollback if local record deletion cannot commit
- TypeScript, 70 Jest suites / 483 tests, Git whitespace validation, and Android Metro bundling all passed before commit `0748023`

## Milestone 10.1 release gates

- Run Expo dependency-alignment and project-health checks
- Complete the full physical-device smoke test, including relaunch persistence and **Delete All App Data**
- Publish a public privacy-policy URL for App Store and Play listing metadata
- Create signed Android and iOS preview builds through the owner's Expo account
- Capture store-ready screenshots from signed builds
- Prepare store descriptions, age/content ratings, and privacy/data-safety declarations
- Fix release-blocking findings, rerun verification, and merge the approved release branch into `main`

The executable checklist is in `docs/milestone-10-1-release-candidate-checklist.md`.

## Deliberately deferred until after release

- Authentication and user accounts
- Cloud backup or multi-device sync
- Subscriptions and payments
- AI APIs, hosted video, analytics, or advertising
