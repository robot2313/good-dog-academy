# Milestone 10 — Release-Ready MVP

## Goal

Turn the verified local MVP into a buildable, reviewable release candidate without adding accounts, cloud sync, subscriptions, analytics, or a backend.

## App identity and branding

- Display name: Good Dog Academy
- Slug: `good-dog-academy`
- Version: `1.0.0`
- iOS bundle identifier: `com.robot2313.gooddogacademy`
- Android package: `com.robot2313.gooddogacademy`
- URL scheme: `gooddogacademy`
- Native appearance: light, with the warm bone `#F5F0E6` launch background
- Production assets: `assets/branding/app-icon.png` and `assets/branding/app-mark.png`

The package identifiers are permanent release identity. Changing either after publication would create a different store application.

## Privacy and local data

This version has no user account, Good Dog Academy backend, cloud sync, advertising SDK, or analytics SDK. It stores the following on the device:

- Owner display name
- Dog profile and optional managed photo
- Behaviour assessment answers and derived profile
- Lesson progress, daily plans, training sessions, achievements, and settings

The Dog tab links to an in-app **Privacy and Your Data** screen. The privacy contact is `GoodDogAcademy1@gmail.com`.

**Delete All App Data** requires destructive confirmation. It removes every registered Good Dog Academy storage key in one staged transaction, deletes the app-managed dog-photo directory, resets presentation state, and returns to Welcome. If a storage commit fails, already-applied key removals are rolled back and the current app state is retained.

## Build profiles

`eas.json` defines:

- `development`: internal development-client builds
- `preview`: internal release-candidate builds
- `production`: store-targeted builds with locally controlled version numbers

Creating signed builds requires the product owner's Expo account and platform credentials. Store submission is handled by Milestone 10.1 after this implementation milestone.

## Verification gate

Before approval to commit:

1. TypeScript compilation passes.
2. All Jest suites pass without warnings.
3. Expo dependency alignment and project health checks pass or have documented SDK-compatible exceptions.
4. Expo can resolve the public production configuration.
5. Android production export succeeds.
6. Git whitespace validation passes.
7. On a physical device, verify onboarding, photo selection/removal, assessment, Today plan, lesson completion, history/progress, troubleshooter, Privacy screen, app relaunch persistence, and Delete All App Data returning to Welcome.

## Store work still required

The in-app disclosure does not replace the public privacy-policy URL required in store listing metadata. A hosted policy, screenshots, listing copy, ratings questionnaires, data-safety declarations, signed preview builds, and the complete human device gate are tracked in `docs/milestone-10-1-release-candidate-checklist.md`.
