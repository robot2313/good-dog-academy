# Good Dog Academy — Project State

## Current checkpoint

**Milestone 11 curriculum expansion is in progress on `feature/milestone-11-curriculum-expansion`. The catalogue has been expanded from 30 to 60 lessons and requires final verification plus media completion before release-candidate work resumes.**

The warm editorial redesign and expanded adaptive Training Troubleshooter have received an Expo Go visual approval on a physical device. The complete destructive-data and relaunch smoke-test gate is still pending.

## Completed product experience

- Local Owner and Dog onboarding with optional managed dog photo
- Deterministic behaviour assessment and personalised training plan
- Sixty immutable reward-based lessons with search, filters, prerequisites, and journey states
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

## Milestone 11 curriculum expansion

- Added three lessons to every behaviour skill: one support lesson, one applied-practice lesson, and one maintenance lesson
- Preserved all 30 permanent existing lesson IDs and their original prerequisite chains
- Added 30 new permanent lesson IDs with measurable completion criteria, practical troubleshooting, and safety guidance
- Added image-generation specifications for all new lessons
- Locked runtime lesson imagery to photorealistic photographs only; legacy category cartoons are prohibited and test-guarded
- Kept the existing 30 approved lesson photographs; the 30 new lessons temporarily reuse approved realistic same-skill photographs until unique photographs are generated and approved
- Updated catalogue audits, library/coaching counts, architecture notes, store metadata, and authoring guidance for 60 lessons

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
