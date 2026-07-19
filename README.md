# Good Dog Academy

Good Dog Academy is an Expo React Native dog-training application focused on personalised, adaptive training. The current build includes a production onboarding and dog-profile flow backed by a validated local domain and persistence architecture.

## Current status

Completed milestones:

- **Milestone 1 — Modular foundation:** React Navigation stack and bottom tabs, reusable components, theme, hooks, services, and an AsyncStorage abstraction.
- **Milestone 2 — Domain foundation:** typed Owner, Dog, BehaviourProfile, Lesson, DailyPlan, TrainingSession, Achievement, Progress, and NotificationSettings models; runtime validators; repositories; and local persistence.
- **Milestone 2.1 — Domain hardening:** schema migrations, staged transactions, rollback, ownership deletion rules, structured initialization errors, development-only seed separation, and comprehensive domain/repository tests.
- **Milestone 3 — Onboarding and dog profile:** Welcome → Owner Setup → Dog Setup → existing main application, with validated forms, optional dog photo, reliable persisted completion detection, and atomic Owner/Dog/BehaviourProfile creation.

Not implemented yet:

- Behaviour assessment
- Adaptive recommendations
- Daily plan generation
- Production lesson flows
- Authentication or backend services
- Cloud sync
- Subscriptions or payments
- AI APIs or hosted video

The project intentionally remains on **Expo SDK 54** and is compatible with Expo Go for that SDK.

## Requirements

- Node.js and npm
- Expo Go compatible with SDK 54, or an Android/iOS simulator
- Git is recommended for Expo Doctor’s ignore-file checks

## Setup

From the project root:

```powershell
npm install
```

Start the Expo development server:

```powershell
npm start
```

Other launch commands:

```powershell
npm run android
npm run ios
npm run web
```

On Windows systems that block PowerShell npm shims, use `npm.cmd` and `npx.cmd` instead.

## Testing and verification

Run the complete unit and integration suite:

```powershell
npm test
```

Run the TypeScript compiler without emitting files:

```powershell
npm run typecheck
```

Check Expo dependency alignment and project health:

```powershell
npx expo install --check
npx expo-doctor
```

Verify that Metro can create an Android production bundle:

```powershell
npx expo export --platform android
```

## Architecture

```text
App.tsx
└── providers
    ├── application presentation state
    └── onboarding session state
        └── navigation
            ├── onboarding stack
            └── existing bottom tabs

src/
├── components/       Shared accessible UI components
├── data/             Existing presentation lesson data
├── development/      Explicit development-only seed fixtures and tools
├── domain/
│   ├── models/       Persistent domain entities
│   ├── repositories/ Storage contracts
│   └── validation/   Runtime boundary validation
├── features/
│   └── onboarding/   Forms, screens, validation, status, and completion service
├── hooks/            Presentation hooks
├── navigation/       Root stack and bottom-tab configuration
├── screens/          Existing main application screens
├── services/         Repository factories, transactions, ownership, initialization
├── state/            Existing main application presentation state
├── storage/
│   └── migrations/   Versioned local-storage migration framework
├── theme/            Colours and shared styles
├── types/            Presentation and navigation types
└── utils/            IDs and calculations

tests/
├── domain/           Domain validator tests
├── onboarding/       Form, navigation, status, and completion tests
├── services/         Transaction and ownership tests
├── storage/          Repository, migration, and transaction tests
└── support/          In-memory StorageAdapter
```

## Persistence and onboarding

AsyncStorage is accessed only through `StorageAdapter` and validated repositories. Startup runs the schema migration manager before the persisted domain is used.

Onboarding completion stages Owner, Dog, and initial BehaviourProfile writes in one application-level transaction. The commit succeeds completely or restores the previous records. No DailyPlan or demo content is created during onboarding.

The app enters the main tabs only when persisted Owner, Dog, and BehaviourProfile records exist, validate successfully, and have valid ownership relationships. Missing, incomplete, or corrupt records do not count as completed onboarding.

Development seed data is opt-in under `src/development/seed`; production startup never imports or executes it.

## Project safeguards

- Do not run `npm audit fix --force`; it may force an incompatible Expo upgrade.
- Install native packages through `npx expo install` to retain SDK 54 alignment.
- Add storage migrations whenever persisted model shapes change.
- Keep screens independent of raw AsyncStorage.
- Keep multi-record domain writes inside the transaction layer.
