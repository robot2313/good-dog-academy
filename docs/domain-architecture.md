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

Version 5 is current. Migration 1→2 adds Owner onboarding preferences and Dog profile fields. Migration 2→3 introduces complete skill scores and assessment linkage. Migration 3→4 introduces LessonProgress without automatically creating records. Migration 4→5 atomically retires unverifiable presentation-only DailyPlan drafts before the production plan shape is used. Each migration and its version update use the staged transaction manager, so failed writes restore prior state. Re-running startup at version 5 is idempotent.

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

`LessonDefinition` is immutable bundled content with permanent kebab-case identifiers, positive integer content versions, typed BehaviourSkill and category values, difficulty levels 1–5, prerequisites, structured troubleshooting, safety notes, and measurable completion criteria. Higher difficulty always means more advanced training. There is no LessonDefinition AsyncStorage key or repository.

The production catalogue contains 30 active version-1 lessons: Foundation, Developing, and Advanced progressions for all ten BehaviourSkills. Content is split into one definition module per skill; test-only definitions remain under `tests/support`. The catalogue loader validates every definition, checks duplicate IDs and supported skills, verifies every prerequisite reference, and performs depth-first cycle detection. A valid catalogue is copied into deeply frozen records and sorted by difficulty then stable ID. Application initialization loads the catalogue after migrations and maps validation failures into structured initialization errors.

`LessonProgress` is mutable local user data owned through Owner → Dog. It stores status, attempt and completion counters, timestamps, best performance rating, current difficulty adjustment, and unlock time while referencing an immutable lesson ID. Its repository uses AsyncStorage through the standard StorageAdapter and runtime validator.

The unlock service is deterministic. Active lessons without prerequisites are available. A prerequisite lesson remains locked until every required lesson reaches its specified successful-completion count. An unlocked lesson with attempts is in progress; its own completion criteria determine completed status. Missing catalogue references and duplicate progress for the same lesson are rejected.

The explicit progress initialization service validates Owner/Dog ownership, evaluates the current catalogue, preserves all existing progress, and creates only missing records. Its writes are staged under one transaction, so a failure commits none. Repeated calls are idempotent. It is deliberately not invoked during onboarding, assessment, migration, or application startup.

Content versions are not stored in LessonProgress. Increasing `contentVersion` under the same stable ID therefore preserves all attempts, completions, status, timestamps, performance, and difficulty adjustment. A materially different competency receives a new ID. Inactive definitions remain in the immutable catalogue, are locked and excluded from new progress initialization and future planning, and never cause existing progress deletion. Reactivation under the same ID resumes retained progress.

`LessonEligibilityService` is the pure contract for the future Daily Plan engine. Given a lesson ID, dog age, validated catalogue, and progress records, it returns eligibility, deterministic reasons, skill, difficulty, status, prerequisite state, age state, activity, recognised-skill state, and separate new-learning and reinforcement flags. Active available/in-progress lessons may be new learning; active completed lessons may be reinforcement. Locked or inactive lessons are neither. Missing references throw a structured error.

Production content is reward-based, force-free, non-diagnostic, and usable without video. Automated audits enforce content depth, permanent IDs, stage chains, durations, measurable criteria, and prohibited-method policy. Reactivity content requires below-threshold distance, secure equipment, planned exits, no forced greetings, and professional or veterinary escalation when risk or sudden change warrants it. See `docs/lesson-authoring-guide.md` for the complete authoring contract.

The Daily Plan engine reads the frozen catalogue through the eligibility service and combines the latest profile-linked assessment, dog age, LessonProgress, and seven recent plans. It creates at most two typed items, persists once per owner/dog/local date in a transaction, and reuses the dated plan on subsequent requests. It never creates training sessions or achievements.

## Behaviour assessment

`BehaviourAssessment` belongs to both an Owner and a Dog. Each immutable record preserves every raw response, its stable question ID, typed skill, selected option, frequency value, and scoring direction, plus the calculated scores and unknown skills. Completing a new assessment appends a record; the BehaviourProfile points at the current assessment without deleting older history.

Question definitions live in `src/features/assessment/catalogue.ts` as frozen bundled content. They are not mutable repository records. The ten typed skills are Recall, Loose Lead Walking, Jumping, Barking, Chewing, Reactivity, House Training, Confidence, Impulse Control, and Focus.

Frequency values run from 0 (Never) through 4 (Almost always). Positive questions use `value × 25`; negative questions use `(4 - value) × 25`, so higher is always better. “Not sure / Not observed” persists a null frequency, adds the skill to `unknownSkills`, and uses 50 only as a neutral initial value; the UI does not present it as measured progress.

Assessment answers remain in React memory until final completion. The completion transaction stages both the new BehaviourAssessment and updated BehaviourProfile. A validation, operation, or commit failure leaves both stored collections unchanged, reports `BEHAVIOUR_ASSESSMENT_SAVE_FAILED`, and retains current-session answers for retry.

Startup routing validates records and relationships: missing setup routes to onboarding; complete setup without a matching assessment routes to assessment; a valid profile-referenced assessment with matching Owner and Dog routes to the main tabs. Unreadable assessment storage routes to a recoverable assessment state. Recovery is explained and confirmed before assessment data is cleared; valid setup is preserved.

Severe reactivity observations display calm, non-diagnostic safety guidance. The notice prioritises distance and avoiding forced interactions and recommends qualified force-free professional or veterinary help when injury is possible, without blocking completion.

## Development data

Demo fixtures live under `src/development/seed`. Production startup never imports or executes them. `seedDevelopmentData` additionally checks `__DEV__` and refuses to run in a production build. The function is opt-in and is not called by the application entry point.
