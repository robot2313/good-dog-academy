# MILESTONE 12 — DATA AUDIT

Audit of the verified production project (Milestones 10 + 11 complete, FABLE-5 approved) performed
before any Milestone 12 code was written. Every "source of truth" below is the file that actually
owns that data in production today.

## Persistence layer

All domain data is persisted locally through AsyncStorage:

- `src/storage/AsyncStorageAdapter.ts` + `src/storage/AsyncStorageRepository.ts` — validated
  collection-per-key repositories.
- `src/storage/StorageTransactionManager.ts` — multi-key transactions with rollback.
- `src/storage/storageKeys.ts` — canonical key list (owners, dogs, behaviour-profiles,
  behaviour-assessments, lesson-progress, daily-plans, training-sessions, achievements, progress,
  notification-settings, troubleshooter-attempts).
- `src/storage/migrations/*` — schema versions 1→5 with `MigrationManager`.
- `src/services/createDomainRepositories.ts` — the only factory for typed repositories; every
  record is validated on read/write by `src/domain/validation/validators.ts`.

There is no cloud backend. Everything is on-device.

## Sources of truth found

| Concern | Source of truth |
| --- | --- |
| Owner profile | `Owner` model, `owners` key; written by onboarding (`OnboardingCompletionService`) |
| Dog profile | `Dog` model (`dogs` key): name, breed, DOB or `estimatedAgeYears`, sex, weight, energy level, photo |
| Dog age / life stage | Derived, not stored: `dogAgeMonths(...)` in `DailyPlanGenerationService` and `dogAgeMonthsAt(...)` in `LessonSessionCompletionService`; life-stage presentation in `src/features/lessons/discovery/` (DogStages) |
| Assessment answers | `BehaviourAssessment.responses` (`behaviour-assessments` key), authored by `src/features/assessment/` (catalogue of 10 questions, one per `BehaviourSkill`) |
| Assessment results | `BehaviourAssessment.calculatedScores` (0–100 per skill, 50 = neutral/unknown) + `unknownSkills`; mirrored onto `BehaviourProfile.skillScores` (`behaviour-profiles` key) via `BehaviourAssessmentTransactionService` |
| Lesson catalogue | `src/features/lessons/catalogue/LessonCatalogue.ts` — validated, cycle-checked, immutable |
| All 60 production lessons | `src/features/lessons/catalogue/definitions/*.ts` (10 files × 6 lessons), bundled by `bundledLessonDefinitions.ts`, loaded by `lessonCatalogueLoader.ts` |
| Lesson categories | Two axes: `LessonDefinition.skill` (the 10 `BehaviourSkill`s — the user-facing training categories) and `LessonDefinition.category` (foundation / life-skills / behaviour / safety) |
| Lesson prerequisites | `LessonDefinition.prerequisites` (`{ lessonId, minimumSuccessfulCompletions }`), enforced by `LessonUnlockService` + `LessonEligibilityService` |
| Lesson difficulty | `LessonDefinition.difficultyLevel` (1–5) |
| Daily Plan generation | `DailyPlanGenerationService.getOrCreate` — transactional, idempotent per dog per local date, persists `DailyPlan` |
| Daily Plan recommendations | `DailyPlanRecommendationService.recommend` — deterministic scoring over eligible lessons using skill scores, progress status, needs-practice gap, reinforcement recency, difficulty preference, recent-plan penalty |
| Lesson completion | `LessonSessionCompletionService.complete` — validates ownership/eligibility, updates `LessonProgress`, saves `TrainingSession`, recomputes unlock statuses, closes covered Daily Plans; rating ≥3 counts as a successful completion; outcome mapping: rating ≥4 `success`, 3 `partial-success`, ≤2 `unsuccessful` |
| Lesson progress | `LessonProgress` (`lesson-progress` key): status, attempts, successfulCompletions, last attempted/completed, bestPerformanceRating, `currentDifficultyAdjustment` (persisted but never written by any service — always 0 in practice) |
| Guided training sessions | `src/features/lessons/session/guidedSession.ts` reducer (prepare → training → feedback → saving → complete) with Success / Try Again ("recordSuccess"/"recordChallenge") check-ins, one-level Undo, reset suggestion after 3 consecutive challenges |
| Success / Try Again state | In-session: `GuidedSessionState.successfulRepetitions` / `needsHelpRepetitions` (not persisted per-tap). Persisted per session: `TrainingSession.outcome` + rating-derived success on `LessonProgress` |
| Session history | `TrainingSession` records (`training-sessions` key), queried by `TrainingHistoryQueryService` and `SessionHistoryScreen`/`SessionDetailScreen` |
| Progress | `ProgressScreen` + `DogLearningPassportQueryService` (`src/features/progress/passport/`) — derives snapshot, per-skill evidence levels, timeline, next step from lessons/sessions/troubleshooter attempts. The stored `Progress` model exists but the passport derives from canonical records |
| Troubleshooter | `src/features/troubleshooter/`: 13 concerns × 3 scenarios (`troubleshooterCatalogue.ts`), deterministic failure-category resolution + fallback levels 1–3 (`DogTroubleshooterService`), authored protocols (`troubleshooterProtocols.ts`), safety overrides for aggression / pain / injury-risk body states |
| Troubleshooter outcomes | `TroubleshooterAttempt` records (`troubleshooter-attempts` key) saved by `TroubleshooterHistoryService`; outcomes drive next fallback level |
| "This isn't working?" lesson support | `lessonSupportContent.ts` — reorganises the lesson's own troubleshooting/tips/safety content into the help modal in `LessonSessionScreenView` |
| Persistence | See persistence layer above; `initializeApplication.ts` runs migrations + catalogue load at startup |
| Selected dog | `OnboardingStatusService` / `OnboardingContext` (`status.state === 'complete'` exposes owner + dog); consumed by `LessonLibraryContext`, `useTodayPlan`, screens |
| Navigation | `src/navigation/AppNavigator.tsx` + `MainTabBar` (Today / Plan / Academy / Progress / Dog), routes typed in `src/types/navigation.ts` |

## Data that EXISTS and can ground adaptation

- Per-dog skill scores + unknown skills from the latest assessment (0–100, direction-normalised).
- Per-dog, per-lesson progress: attempts, successful completions, timestamps, best rating.
- Per-dog training sessions with outcome (`success` / `partial-success` / `unsuccessful`),
  duration, timestamps, linked lesson and daily plan.
- Per-dog troubleshooter attempts with topic, failure category, fallback level and outcome.
- Daily plan history (per local date, with reason codes).
- Full lesson content: steps, tips, common mistakes, per-lesson troubleshooting
  problems/solutions, safety notes, completion criteria, prerequisites, difficulty, min age.
- Deterministic prerequisite/unlock/eligibility evaluation.

## Data that DOES NOT exist (the engine must not pretend it does)

- Per-step or per-repetition outcomes are NOT persisted. Success/Try Again taps exist only inside
  the live guided session; only the end-of-session rating/outcome is saved. "Struggled on step 3"
  cannot be derived.
- `LessonProgress.currentDifficultyAdjustment` is persisted but no production service ever sets it;
  it carries no real signal.
- No stored environment/distraction level for lesson sessions (only troubleshooter attempts record
  an `environment` string).
- No stored training goals beyond `Owner.primaryGoal` from onboarding; no per-dog goal history.
- No mastery measure beyond completion criteria — "mastered" must not be claimed.
- The legacy `AppStateContext` (`src/state/`) is a pre-domain in-memory demo store used by legacy
  code paths, not the production source of truth; Milestone 12 does not build on it.
- No AI backend, no network layer, no server: any LLM integration has no secure place to hold an
  API key inside this project today.

## Existing systems Milestone 12 must reuse (and did)

`LessonCatalogue`, `LessonEligibilityService`, `LessonUnlockService`,
`DailyPlanRecommendationService` / `DailyPlanGenerationService` / `TodayPlanService`,
`LessonSessionCompletionService`, `DogTroubleshooterService` + protocols + safety overrides,
`DogLearningPassportQueryService`, repositories/transactions/migrations, `OnboardingContext`
selected-dog flow, FABLE-5 screens and components.

## Pre-existing repository observations (not modified)

- Two stray files from a Windows PowerShell session are present at the repo root: `tart -c` (a CSV
  fragment) and `ts -Recurse -Include .ts,.tsx  ForEach-Object {`. They are unrelated junk, were
  left untouched in the working tree, and are excluded from the delivery ZIP.
- `docs/milestone-12-reference-ui-redesign.md` already exists from earlier visual work; this
  engineering milestone's documents live at the repo root as specified in the brief.
