# Good Dog Academy

Good Dog Academy is an Expo React Native dog-training application focused on personalised, adaptive training. The current build includes production onboarding, a dog profile, deterministic behaviour assessment, and a validated 30-lesson immutable training catalogue.

## Current status

Completed milestones:

- **Milestone 1 — Modular foundation:** React Navigation stack and bottom tabs, reusable components, theme, hooks, services, and an AsyncStorage abstraction.
- **Milestone 2 — Domain foundation:** typed Owner, Dog, BehaviourProfile, DailyPlan, TrainingSession, Achievement, Progress, and NotificationSettings models; runtime validators; repositories; and local persistence.
- **Milestone 2.1 — Domain hardening:** schema migrations, staged transactions, rollback, ownership deletion rules, structured initialization errors, development-only seed separation, and comprehensive domain/repository tests.
- **Milestone 3 — Onboarding and dog profile:** Welcome → Owner Setup → Dog Setup → existing main application, with validated forms, optional dog photo, reliable persisted completion detection, and atomic Owner/Dog/BehaviourProfile creation.
- **Milestone 3.1 — Onboarding integrity:** app-managed persistent dog photos, native localized birthday selection, confirmed corrupt-data recovery, atomic migration 1→2 coverage, and legacy onboarding cleanup.
- **Milestone 4 — Behaviour assessment:** an accessible five-screen assessment covering ten skills, deterministic scoring, raw-response history, atomic BehaviourAssessment/BehaviourProfile persistence, schema migration 2→3, safety messaging, and relationship-aware startup routing.
- **Milestone 5 — Lesson catalogue foundation:** immutable validated LessonDefinition content, deterministic prerequisite and unlock evaluation, mutable per-dog LessonProgress, atomic idempotent progress initialization, ownership cascades, and schema migration 3→4.
- **Milestone 5.1 — Initial training content:** 30 production-quality force-free lessons across ten skills, three-stage prerequisite progressions, content-version and inactive-content policies, and a deterministic future Daily Plan eligibility contract.
- **Milestone 6 — Training experience:** the Academy now presents the full 30-lesson catalogue with skill filters, expandable step-by-step instructions, safety guidance, session completion actions, and per-skill progress summaries.
- **Milestone 7 — Adaptive daily plans:** one persisted plan per dog per day prioritises eligible new learning, weaker measured skills, in-progress work, and balanced reinforcement while respecting prerequisites and minimum ages.
- **Milestone 8 — Training sessions:** lesson feedback records atomic TrainingSession history, attempts, successful completions, performance ratings, and prerequisite unlocks; completed paths remain available for reinforcement practice.
- **Milestone 9 — Progress intelligence:** every session updates durable totals, training minutes, calendar streaks, completed paths, daily-plan status, recent activity, and milestone achievements in the same transaction.
- **Milestone 10 — Daily Plan control:** owners can swap scheduled lessons for deterministic eligible alternatives or confirm a rest day, with every plan transition persisted safely and completed plans protected from later changes.
- **Milestone 11 — Training journal:** a complete navigable session history supports ownership-checked, transactional notes so owners can preserve observations, context, and next-session ideas alongside each outcome.
- **Milestone 12 — Seven-day planner:** the app creates an idempotent personalised training week, rotates eligible skills, preserves existing and completed days, supports reversible rest days, and validates manual one-or-two-lesson schedules.
- **Milestone 13 — Training reminders:** persistent local preferences provide morning, midday, evening, or off presets; phone delivery is permission-aware, disabling cancels schedules, and web safely preserves preferences without pretending to deliver notifications.
- **Milestone 14 — Journal search and export:** session history supports text search, result and skill filters, clear empty states, and privacy-conscious CSV export of the visible results on web and mobile.

Not implemented yet:

- Backend sync and cross-device notification delivery
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
        └── assessment session state
            └── navigation
                ├── onboarding stack
                ├── behaviour assessment stack
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
│   ├── assessment/   Immutable questions, scoring, screens, state, and atomic completion
│   ├── lessons/      Immutable catalogue, prerequisite engine, and progress initialization
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
├── assessment/       Scoring, catalogue, navigation, recovery, and atomic completion tests
├── lessons/          Catalogue, prerequisite, unlock, and progress initialization tests
├── domain/           Domain validator tests
├── onboarding/       Form, navigation, status, and completion tests
├── services/         Transaction and ownership tests
├── storage/          Repository, migration, and transaction tests
└── support/          In-memory StorageAdapter
```

## Persistence and onboarding

AsyncStorage is accessed only through `StorageAdapter` and validated repositories. Startup runs the schema migration manager before the persisted domain is used.

Onboarding completion stages Owner, Dog, and initial BehaviourProfile writes in one application-level transaction. The commit succeeds completely or restores the previous records. No DailyPlan or demo content is created during onboarding.

Selected dog photos remain temporary during form entry. At completion they are copied into the app document directory and only the managed URI is stored. Failed onboarding transactions remove the managed copy. Exact birthdays use the platform-native date picker with future dates disabled; estimated age remains available.

After onboarding, the app routes into the Behaviour Assessment until a valid BehaviourAssessment belongs to the current Owner and Dog and is referenced by the Dog's BehaviourProfile. Only then does it enter the main tabs. Startup derives this state from validated records and ownership relationships rather than a completion boolean.

The bundled assessment catalogue is immutable application content, not AsyncStorage data. It covers Recall, Loose Lead Walking, Jumping, Barking, Chewing, Reactivity, House Training, Confidence, Impulse Control, and Focus. Positive questions score `frequencyValue × 25`; negative questions score `(4 - frequencyValue) × 25`. “Not sure / Not observed” stores the raw response, records the skill in `unknownSkills`, and assigns a neutral unmeasured starting value of 50.

Assessment answers remain in memory until completion. Completion validates all ten responses, stores a new raw BehaviourAssessment without deleting history, and updates the BehaviourProfile inside one staged transaction. A failure commits neither record and keeps the answers available for retry. Severe reactivity answers show calm, non-diagnostic safety guidance and recommend qualified force-free professional or veterinary help when injury is possible.

Corrupt assessment data has a separate recoverable startup state. The app explains the issue and requires confirmation before clearing only assessment data; valid Owner, Dog, and BehaviourProfile setup is retained.

## Lesson catalogue and progress

`LessonDefinition` records are bundled, deeply frozen application content. They are never stored in AsyncStorage and have no mutable repository. Startup loads and validates the complete catalogue, rejecting malformed definitions, unsupported skills, duplicate IDs, missing prerequisite references, and circular dependency chains with structured errors. Ordering is deterministic by difficulty and stable lesson ID.

The initial catalogue contains 30 active lessons: Foundation, Developing, and Advanced lessons for Recall, Loose Lead Walking, Focus, Jumping, Barking, Chewing, Reactivity, House Training, Confidence, and Impulse Control. Definitions are organised into one module per skill under `src/features/lessons/catalogue/definitions`. All lessons use reward-based, force-free methods, practical safety notes, measurable criteria, and complete text-based instructions. Authoring rules are documented in [docs/lesson-authoring-guide.md](docs/lesson-authoring-guide.md).

`LessonProgress` is mutable per-Owner/per-Dog data stored through the standard repository abstraction. It tracks status, attempts, successful completions, performance, difficulty adjustment, unlock dates, and activity timestamps while referencing a stable immutable lesson ID.

The prerequisite engine derives `locked`, `available`, `inProgress`, or `completed` from catalogue requirements and existing progress. All prerequisites must meet their required successful-completion counts. The explicit initialization service creates only missing progress records, preserves existing records, is idempotent, and saves through one transaction. It is not called during onboarding, assessment, migration, or startup.

Lesson IDs are permanent. Content-only revisions increment numeric `contentVersion` without resetting attempts, completions, status, timestamps, ratings, or difficulty adjustment. Inactive definitions remain in the catalogue, are excluded from new initialization and future plans, and retain existing progress so it resumes if the same ID is reactivated.

The pure eligibility service returns structured learning and reinforcement eligibility, status, prerequisite and age checks, activity and recognised-skill flags, difficulty, and deterministic reason codes. Available or in-progress active lessons may be new learning; completed active lessons may be reinforcement; locked, inactive, under-age, or missing-reference content cannot silently become eligible. No Daily Plans are generated yet.

Deleting a Dog or Owner cascade-deletes LessonProgress. Immutable LessonDefinition content is application code and is never included in user-data deletion. Future Daily Plan work can consume the validated catalogue and progress status, but Milestone 5 does not generate plans or recommendations.

Incomplete or corrupt onboarding data is never silently cleared. The Welcome screen explains the problem and requires a separate confirmation before ownership-aware, transactional recovery runs.

Development seed data is opt-in under `src/development/seed`; production startup never imports or executes it.

Development builds expose a confirmed **Reset App Data** action under Dog → Developer Tools. It applies Owner/Dog ownership cascades, removes managed dog photos, clears presentation state, and returns immediately to Welcome. The module is guarded by `__DEV__` and is removed from production bundles.

## Project safeguards

- Do not run `npm audit fix --force`; it may force an incompatible Expo upgrade.
- Install native packages through `npx expo install` to retain SDK 54 alignment.
- Add storage migrations whenever persisted model shapes change.
- Keep screens independent of raw AsyncStorage.
- Keep multi-record domain writes inside the transaction layer.
