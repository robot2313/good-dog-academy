# MILESTONE 12 — CHANGELOG

Adaptive Training Engine + Controlled AI Coach. No visual redesign: FABLE-5 is preserved, and the
only UI addition is a coach panel inside two existing surfaces plus one insight line on Progress.

## Summary

- Added a deterministic adaptive recommendation engine driven entirely by real stored data.
- Added a controlled AI coach architecture that is fully useful with **no AI provider connected**,
  which is how it ships (no secure backend exists — see `MILESTONE-12-AI-SAFETY.md`).
- Integrated both into the EXISTING Daily Plan, Troubleshooter, lesson flow and Progress systems.
  No parallel replacements were created.

## Added

### Adaptive module — `src/features/adaptive/`
| File | Purpose |
| --- | --- |
| `trainingState.ts` | Canonical derived per-dog training state; enforces dog isolation |
| `AdaptiveRecommendationEngine.ts` | Deterministic scoring/ranking of eligible lessons |
| `difficultyGuidance.ts` | Difficulty adjustments sourced only from approved content |
| `recommendationExplanations.ts` | Deterministic human-readable reasons from actual factors |
| `progressInsight.ts` | Evidence-gated Progress insight |
| `AdaptiveQueryService.ts` | Reads canonical repositories → state + recommendations |
| `adaptiveQueryServiceInstance.ts` | Wired instance over the production repositories |
| `useAdaptiveState.ts` | Best-effort read hook (takes owner/dog IDs; never blocks the flow) |
| `index.ts` | Barrel |

### Coach module — `src/features/coach/`
| File | Purpose |
| --- | --- |
| `coachTypes.ts` | Fixed approved question set, `CoachContext`, `CoachProvider` boundary |
| `coachSafety.ts` | Deterministic risk classifier + escalations + humane-policy gate |
| `deterministicCoach.ts` | Approved-content answers (the no-AI fallback and the source of truth) |
| `CoachService.ts` | Pipeline: safety → deterministic → optional provider → policy gate |
| `buildCoachContext.ts` | Narrow structured context assembly (no whole-curriculum prompts) |
| `coachServiceInstance.ts` | Ships with `coachProvider = null` |
| `AskTheCoachPanel.tsx` | FABLE-5-styled panel; fixed questions, no free-text chat |
| `index.ts` | Barrel |

### Documentation
`MILESTONE-12-DATA-AUDIT.md`, `MILESTONE-12-ADAPTIVE-ENGINE.md`, `MILESTONE-12-AI-SAFETY.md`,
`MILESTONE-12-CHANGELOG.md`.

### Tests — 7 new suites, 54 new tests
`tests/adaptive/recommendationEngine.test.ts`, `tests/adaptive/adaptiveQueryService.test.ts`,
`tests/adaptive/dailyPlanAdaptiveIntegration.test.ts`,
`tests/adaptive/difficultyAndInsight.test.ts`, `tests/adaptive/persistenceCompatibility.test.ts`,
`tests/coach/coachSafety.test.ts`, `tests/coach/coachService.test.ts`,
plus `tests/support/adaptiveFixtures.ts` and `tests/visual/seedGenerator.test.ts`
(the latter emits the visual-proof seed; it is a generator, not a behaviour test).

### Tooling
`scripts/capture-milestone-12-proof.mjs` — serves the exported web build and captures the Milestone
12 states at 390 × 844. Output in `docs/milestone-12-visual-proof/`.

## Modified (5 files, all additive)

| File | Change |
| --- | --- |
| `src/features/daily-plan/DailyPlanGenerationService.ts` | Added a history-gated adaptive promotion step and two storage keys to the generation transaction. Skipped entirely when the dog has no completed sessions, so prior output is unchanged. |
| `src/features/lessons/session/LessonSessionScreenView.tsx` | Added optional `coachSlot` prop rendered inside the existing "This isn't working?" modal, plus one style. No screen redesign. |
| `src/features/lessons/session/LessonSessionScreen.tsx` | Loads adaptive state and supplies the coach panel to the view. |
| `src/features/troubleshooter/DogTroubleshooterScreen.tsx` | Renders the coach panel after a standard result. Suppressed when a safety override is showing or in "help now" mode. |
| `src/screens/ProgressScreen.tsx` | Renders the evidence-gated adaptive insight above skill evidence. Progress was not rebuilt. |

## Deleted

None.

## Fixed during verification

- The coach answer originally rendered below the question list and fell off-screen inside the host
  modal. Found by eye review of `07-coach-deterministic-answer.png`; the answer now renders directly
  under the panel header and is immediately visible. Re-exported and re-captured to confirm.
- `useAdaptiveState` originally read the onboarding context, which broke two existing screen test
  harnesses. Refactored to accept owner/dog IDs the host screens already hold; both suites returned
  to green with no changes to those tests.

## Verification

| Gate | Result |
| --- | --- |
| TypeScript | Clean (`tsc --noEmit`) |
| Jest | 80 suites / 562 tests passed (baseline 73 / 508) |
| Expo Doctor | 18/18 checks passed |
| Visual proof | 11 states captured at 390 × 844 and reviewed by eye |

**Test integrity: no existing test was weakened, removed, or altered.** The pre-existing daily-plan
generation test that asserts exact primary/reinforcement selection still passes unmodified — which is
the intended proof that adaptive promotion is genuinely history-gated.

## Not committed

The milestone is left uncommitted for review as instructed. Note that the uploaded project contained
no `.git` directory, so `git diff --check`, `git diff --stat` and `git status --short` could not be
run; the change report above was produced by diffing the working tree against a pristine extraction
of the supplied ZIP.

## Out of scope (untouched)

Per-step photography, lesson photos, FABLE-5 redesign, community/social, trainer marketplace, video,
subscriptions, cloud accounts, XP/coins/leaderboards/achievements, database rewrite, navigation
rewrite, unrelated visual polish.
