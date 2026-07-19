# Domain architecture

The domain layer is independent of React Native UI and navigation. Screens continue to use the existing presentation state until a reviewed milestone explicitly connects them to domain repositories.

## Dependency flow

```text
App startup
  -> Initialization service
       -> Migration manager
            -> StorageAdapter -> AsyncStorage

Domain models
  -> validators
  -> repository interfaces
       -> AsyncStorageRepository
            -> StorageAdapter

Domain transaction and ownership services
  -> StorageTransactionManager
       -> transactional StorageAdapter overlay
            -> domain repository factory

Behaviour assessment session
  -> immutable bundled question catalogue
  -> deterministic scoring
  -> BehaviourAssessment completion service
       -> transaction manager
            -> BehaviourAssessment + BehaviourProfile repositories

Lesson catalogue
  -> immutable bundled LessonDefinition content
  -> catalogue validation and deterministic ordering
  -> prerequisite/unlock service
       -> transaction-backed LessonProgress initialization
            -> LessonProgress repository -> StorageAdapter
```

## Schema versions

`CURRENT_SCHEMA_VERSION` identifies the storage layout understood by the installed application. At startup, `MigrationManager` reads the stored version. A new database is stamped with the current version. An older database must have a contiguous migration path registered in `src/storage/migrations/index.ts`; migrations run in order and the stored version is updated after each successful step. A newer or invalid version is rejected safely.

Version 4 is current. Migration 1→2 adds the Owner onboarding preferences and Dog profile fields introduced in Milestone 3. Migration 2→3 replaces the obsolete single confidence field with a complete typed `skillScores` map, `unknownSkills`, and an optional `assessmentId`. Migration 3→4 introduces the LessonProgress storage namespace without automatically creating progress; any pre-release records are preserved. Each migration and its schema-version update run through the staged transaction manager, so failed writes restore the prior schema and records. Re-running startup at version 4 is idempotent.

## Transactions

`StorageTransactionManager` serializes application-level transactions. Each transaction declares its storage keys in advance and writes into an isolated in-memory overlay. Repository reads within the transaction see staged changes. Nothing reaches AsyncStorage until the operation succeeds. Commit failures trigger best-effort restoration from snapshots. This provides atomic behavior inside a running app, but cannot provide the crash guarantees of a transactional database if the process is terminated during the final commit.

## Ownership and deletion

```text
Owner
├── NotificationSettings
└── Dog
    ├── BehaviourProfile
    ├── BehaviourAssessment history
    ├── LessonProgress
    ├── Progress
    ├── TrainingSession
    ├── DailyPlan
    └── Achievement
```

Deleting a Dog deletes all records keyed by that dog, including LessonProgress, before deleting the Dog. Deleting an Owner applies the dog cascade to every Dog belonging to the Owner, deletes the Owner's NotificationSettings, and then deletes the Owner. Immutable LessonDefinition content is bundled application code and is never cascade-deleted. All cascades execute through one application-level transaction.

Development reset uses the same Owner cascade, including BehaviourAssessment history, then removes captured app-managed Dog photo URIs.

## Lesson catalogue foundation

`LessonDefinition` is immutable bundled content with stable `lesson:` identifiers, semantic content versions, typed BehaviourSkill and category values, difficulty levels 1–5, prerequisites, structured troubleshooting, safety notes, and completion criteria. Higher difficulty always means more advanced training. There is no LessonDefinition AsyncStorage key or repository.

The production catalogue is intentionally empty until final content receives product review. Test-only definitions live under `tests/support`. The catalogue loader validates every definition, checks duplicate IDs and supported skills, verifies every prerequisite reference, and performs depth-first cycle detection. A valid catalogue is copied into deeply frozen records and sorted by difficulty then stable ID. Application initialization loads the catalogue after migrations and maps validation failures into structured initialization errors.

`LessonProgress` is mutable local user data owned through Owner → Dog. It stores status, attempt and completion counters, timestamps, best performance rating, current difficulty adjustment, and unlock time while referencing an immutable lesson ID. Its repository uses AsyncStorage through the standard StorageAdapter and runtime validator.

The unlock service is deterministic. Active lessons without prerequisites are available. A prerequisite lesson remains locked until every required lesson reaches its specified successful-completion count. An unlocked lesson with attempts is in progress; its own completion criteria determine completed status. Missing catalogue references and duplicate progress for the same lesson are rejected.

The explicit progress initialization service validates Owner/Dog ownership, evaluates the current catalogue, preserves all existing progress, and creates only missing records. Its writes are staged under one transaction, so a failure commits none. Repeated calls are idempotent. It is deliberately not invoked during onboarding, assessment, migration, or application startup.

A future Daily Plan engine may read the frozen catalogue together with validated LessonProgress to select eligible content. Milestone 5 does not generate DailyPlans, recommendations, training sessions, or achievements.

## Behaviour assessment

`BehaviourAssessment` belongs to both an Owner and a Dog. Each immutable record preserves every raw response, its stable question ID, typed skill, selected option, frequency value, and scoring direction, plus the calculated scores and unknown skills. Completing a new assessment appends a record; the BehaviourProfile points at the current assessment without deleting older history.

Question definitions live in `src/features/assessment/catalogue.ts` as frozen bundled content. They are not mutable repository records. The ten typed skills are Recall, Loose Lead Walking, Jumping, Barking, Chewing, Reactivity, House Training, Confidence, Impulse Control, and Focus.

Frequency values run from 0 (Never) through 4 (Almost always). Positive questions use `value × 25`; negative questions use `(4 - value) × 25`, so higher is always better. “Not sure / Not observed” persists a null frequency, adds the skill to `unknownSkills`, and uses 50 only as a neutral initial value; the UI does not present it as measured progress.

Assessment answers remain in React memory until final completion. The completion transaction stages both the new BehaviourAssessment and updated BehaviourProfile. A validation, operation, or commit failure leaves both stored collections unchanged, reports `BEHAVIOUR_ASSESSMENT_SAVE_FAILED`, and retains current-session answers for retry.

Startup routing validates records and relationships: missing setup routes to onboarding; complete setup without a matching assessment routes to assessment; a valid profile-referenced assessment with matching Owner and Dog routes to the main tabs. Unreadable assessment storage routes to a recoverable assessment state. Recovery is explained and confirmed before assessment data is cleared; valid setup is preserved.

Severe reactivity observations display calm, non-diagnostic safety guidance. The notice prioritises distance and avoiding forced interactions and recommends qualified force-free professional or veterinary help when injury is possible, without blocking completion.

## Development data

Demo fixtures live under `src/development/seed`. Production startup never imports or executes them. `seedDevelopmentData` additionally checks `__DEV__` and refuses to run in a production build. The function is opt-in and is not called by the application entry point.
