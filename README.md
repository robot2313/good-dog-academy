# Good Dog Academy

Good Dog Academy is an Expo React Native dog-training application focused on personalised, adaptive training. The current build includes production onboarding, a dog profile, deterministic behaviour assessment, and a validated 60-lesson immutable training catalogue.

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
- **Milestone 6.1 — Personalised recommendation engine:** pure deterministic ranking of eligible new-learning and reinforcement lessons using assessment scores, progress state, practice need, recency, age, prerequisites, time limits, and skill diversity.
- **Milestone 6 — Deterministic Daily Plan Engine:** production typed plans, supported time budgets, latest-assessment and ownership integrity, recent-plan rotation, local-day idempotency, transactional persistence, schema migration 4→5, and a default 15-minute application entry point.
- **Milestone 7.1 — Lesson Library Foundation:** a read-only, selected-dog-aware service exposes immutable lesson metadata, deterministic skill groups, derived progress states, prerequisite explanations, case-insensitive search, combinable filters, and typed errors for the future library UI. See [Milestone 7.1 documentation](docs/milestone-7-1-lesson-library-foundation.md).
- **Milestones 7.2 and 7.3 — Lesson Library UI, Search, and Filters:** the Academy tab now provides an accessible, phone-friendly lesson browser with selected-dog context, deterministic skill sections, textual progress states, prerequisite guidance, service-backed search, combinable filters, distinct recovery states, and a minimal safe summary route. See [Milestones 7.2 and 7.3 documentation](docs/milestone-7-2-7-3-lesson-library-ui-search-filters.md).
- **Milestone 7.4 — Functional training experience:** Today plans, lesson preparation, guided sessions, completion persistence, and one-time celebration now form a complete local training loop.
- **Milestone 8 — Training history and progress:** saved sessions can be reviewed from the Progress experience, with per-dog history and detail views.
- **Milestone 9 — Premium personalised experience:** warm editorial visual design, selected-dog identity, optional managed profile photography, production lesson imagery, and a dog-training troubleshooter.
- **Milestone 10 — Release-ready MVP:** permanent app identity, production icon and splash branding, EAS build profiles, in-app privacy disclosure, confirmed local-data deletion, and an expanded adaptive Training Troubleshooter.
- **Milestone 10.1 — Release candidate preparation (in progress):** physical-device smoke testing, public privacy-policy hosting, signed preview builds, screenshots, and store metadata. See the [release-candidate checklist](docs/milestone-10-1-release-candidate-checklist.md).
- **Milestone 11 — Curriculum expansion and flexible discovery:** the catalogue now contains 60 force-free lessons, with three additional support, applied-practice, and maintenance lessons for every behaviour skill. Every active lesson has a committed realistic photograph. Home and Academy now keep the personalised Journey separate from user-chosen categories, recommendations, and puppy/adult/senior/rescue collections. Owners may start any active age-appropriate lesson as self-directed training even when it appears later in the recommended Journey. Cartoon and illustrated runtime assets are prohibited and test-guarded. See [Milestone 11 documentation](docs/milestone-11-curriculum-expansion.md).

Not implemented yet:

- Authentication or backend services
- Cloud sync
- Subscriptions or payments
- AI APIs or hosted video
- Hosted privacy-policy URL and final App Store / Play listing metadata

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

## Reference-inspired navigation and visual system

The main navigation is presented as **Home**, **Today**, **Library**, **Progress**, and **Profile**. Home provides direct access to the recommended Journey, personalised recommendations, category browsing, dog-stage collections, and the next Daily Plan lesson. Library begins with ten realistic-photo category rows and continues into the complete searchable catalogue. Dog-stage collections remain curated views over the same immutable lesson catalogue.

The production palette uses a light cream canvas, white cards, deep forest-green actions, sage selections, and a restrained gold accent. Lesson and discovery imagery remains photorealistic-only.

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

The expanded catalogue contains 60 active lessons: six lessons for each of Recall, Loose Lead Walking, Focus, Jumping, Barking, Chewing, Reactivity, House Training, Confidence, and Impulse Control. Every skill retains its Foundation, Developing, and Advanced core path and adds support, applied-practice, and maintenance content. Definitions are organised into one module per skill under `src/features/lessons/catalogue/definitions`. All lessons use reward-based, force-free methods, practical safety notes, measurable criteria, and complete text-based instructions. Authoring rules are documented in [docs/lesson-authoring-guide.md](docs/lesson-authoring-guide.md).

`LessonProgress` is mutable per-Owner/per-Dog data stored through the standard repository abstraction. It tracks status, attempts, successful completions, performance, difficulty adjustment, unlock dates, and activity timestamps while referencing a stable immutable lesson ID.

The prerequisite engine derives `locked`, `available`, `inProgress`, or `completed` from catalogue requirements and existing progress. All prerequisites must meet their required successful-completion counts. The explicit initialization service creates only missing progress records, preserves existing records, is idempotent, and saves through one transaction. It is not called during onboarding, assessment, migration, or startup.

Lesson IDs are permanent. Content-only revisions increment numeric `contentVersion` without resetting attempts, completions, status, timestamps, ratings, or difficulty adjustment. Inactive definitions remain in the catalogue, are excluded from new initialization and future plans, and retain existing progress so it resumes if the same ID is reactivated.

The eligibility service remains the sole lesson gate. The Daily Plan engine combines its result with the latest profile-linked assessment, dog age, progress, and seven recent plans. It creates exactly one primary item and at most one reinforcement, stores the selected supported budget, persists once per owner/dog/local date inside the transaction layer, and returns that same plan on later requests.

Deleting a Dog or Owner cascade-deletes LessonProgress. Immutable LessonDefinition content is application code and is never included in user-data deletion. Future Daily Plan work can consume the validated catalogue and progress status, but Milestone 5 does not generate plans or recommendations.

Incomplete or corrupt onboarding data is never silently cleared. The Welcome screen explains the problem and requires a separate confirmation before ownership-aware, transactional recovery runs.

Development seed data is opt-in under `src/development/seed`; production startup never imports or executes it.

Development builds expose a confirmed **Reset App Data** action under Dog → Developer Tools. It applies Owner/Dog ownership cascades, removes managed dog photos, clears presentation state, and returns immediately to Welcome. The module is guarded by `__DEV__` and is removed from production bundles.

Production builds expose **Privacy and Your Data** under Dog. It explains the app's local-only data model, provides the privacy contact, and offers a confirmed **Delete All App Data** action. Storage keys are cleared through the transaction layer; managed dog photos are also removed, and the app returns to Welcome.

## Project safeguards

- **Photorealistic-only lesson imagery:** runtime manifests and skill fallbacks may reference approved real photographs only. Legacy category cartoons are prohibited and covered by automated tests.

- Do not run `npm audit fix --force`; it may force an incompatible Expo upgrade.
- Install native packages through `npx expo install` to retain SDK 54 alignment.
- Add storage migrations whenever persisted model shapes change.
- Keep screens independent of raw AsyncStorage.
- Keep multi-record domain writes inside the transaction layer.


## Reference UI

The primary UI follows the approved six-screen reference: Home, Categories, Lessons in Category, Lesson Detail, Journey, and Training by Life Stage. Bottom navigation is Home, Journey, Categories, Dogs, and Progress.
