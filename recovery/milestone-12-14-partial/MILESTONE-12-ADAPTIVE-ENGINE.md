# MILESTONE 12 — ADAPTIVE ENGINE

How Good Dog Academy decides what a specific dog should train next. Everything in this document is
deterministic: no language model participates in any training decision.

## Layers

```
canonical records (repositories)
        ↓  deriveTrainingState()
AdaptiveTrainingState        ← recalculated, never stored
        ↓  AdaptiveRecommendationEngine.recommend()
AdaptiveRecommendation[]     ← scored, explained, with sourceData
        ↓
Daily Plan promotion · Ask the Coach context · Progress insight
```

### 1. Canonical training state — `src/features/adaptive/trainingState.ts`

`deriveTrainingState()` takes the dog, behaviour profile, lesson progress, training sessions,
troubleshooter attempts, current daily plan and the lesson catalogue, and derives:

- lesson status sets (completed / in-progress / available / locked) via the EXISTING
  `LessonUnlockService` — prerequisites are not re-implemented;
- per-skill progress counts across the 10 training categories;
- per-lesson recent signals from the newest 10 completed sessions: recent outcomes, successful and
  unsuccessful counts, and the **consecutive unsuccessful streak** counted back from the newest;
- assessment priority skills (known skills scoring ≤ 50, lowest first) and unknown skills;
- `lastTrainedAt`, total completed sessions, and an evidence level:
  `assessment-only` (0 sessions) → `early-history` (1–4) → `established-history` (5+).

**Dog isolation is enforced here.** Every incoming record is filtered by `dogId` before derivation,
so a caller passing a mixed collection cannot leak Dog A's history into Dog B's state. Progress rows
referencing lesson IDs absent from the catalogue are dropped rather than throwing.

Nothing is persisted by this layer. State is always recalculable from canonical records.

### 2. Recommendation engine — `src/features/adaptive/AdaptiveRecommendationEngine.ts`

Candidates are the lessons the existing `LessonEligibilityService` declares eligible for this dog's
age and progress. Ineligible, locked and age-gated lessons never enter scoring.

Each candidate accumulates a `priorityScore` and a list of factors. Base score is `100 − skillScore`
(unknown skills use the neutral 50).

| Factor | Effect | Condition |
| --- | --- | --- |
| `ASSESSMENT_PRIORITY` | (recorded) | Skill is in the dog's assessment priority list |
| `UNKNOWN_SKILL_BASELINE` | +8 | Skill was "Not sure / Not observed" in the assessment |
| `IN_PROGRESS` | +25 | Lesson already started |
| `NEW_LEARNING` | +15 | Eligible as new learning |
| `NEEDS_PRACTICE` | +3 per unsuccessful attempt (max +15) | attempts > successfulCompletions |
| `RECENT_SUCCESS_PROGRESSION` | +12, action `progress` | Every prerequisite has a recent success and no current struggle |
| `REINFORCEMENT_DUE` | + days since completion (max +20) | Lesson completed; offered as a refresher |
| `RECENT_STRUGGLE` | +6 (repeat streak) / +4 (single Try Again) | See difficulty handling below |
| `PREREQUISITE_OF_STRUGGLING_LESSON` | +30, action `return-to-prerequisite` | Completed prerequisite of a struggling lesson |
| `RECENTLY_PRACTISED_PENALTY` | −18 | ≥2 recent sessions, no struggle — prevents endless repetition |
| `LOWER_DIFFICULTY_PREFERENCE` | −2 per level above 1 | Mirrors the production Daily Plan preference |

Ties break by difficulty, then estimated minutes, then lesson ID — so output is fully deterministic.
The clock is injected, so results do not drift with wall time in tests.

**Training balance.** The shortlist takes at most one lesson per skill, *unless* repetition is
justified (a prerequisite return, a difficulty reduction, or a troubleshooter referral). If skill
diversity leaves the list short it is topped up in rank order. This prevents both endless repetition
of one lesson and random jumps across unrelated categories.

### 3. Difficulty handling — `src/features/adaptive/difficultyGuidance.ts`

Struggle is measured from persisted session outcomes only:

- **1 consecutive `unsuccessful`** → `repeat-current-level` (repeat before making anything harder).
- **2 consecutive** (`REPEATED_STRUGGLE_THRESHOLD`) → `reduce-difficulty`, plus approved adjustments;
  the dog's completed prerequisites for that lesson become `return-to-prerequisite` candidates and
  outrank the struggling lesson.
- **3 consecutive** (`TROUBLESHOOTER_REFERRAL_THRESHOLD`) → `open-troubleshooter`: the structured
  existing intervention system, not more of the same advice.

Adjustments are **never generated**. They come from the lesson's own authored troubleshooting
solutions (via the existing `lessonSupportContent` helper) and, only if a lesson has none, from the
matching approved Troubleshooter protocol's level-2 fallback. The curriculum is never rewritten.

The engine never uses the word "mastered": completion criteria are the only completion measure the
app actually stores.

### 4. Explanations — `src/features/adaptive/recommendationExplanations.ts`

`buildRecommendationReason()` is a deterministic template selector driven by the factors and counts
that produced the recommendation, ordered so the most decision-relevant reason wins (prerequisite
return → troubleshooter → difficulty reduction → repeat → progression → in-progress → assessment →
unknown skill → needs practice → reinforcement). The dog's name always comes from the selected dog
profile; no names or histories are hard-coded. Counts quoted in a reason ("the last 2 sessions") are
the actual stored counts.

`dailyPlanItemReason()` does the same for persisted Daily Plan items using only the reason codes the
production generator already stored.

## Integrations

### Daily Plan — `DailyPlanGenerationService`

The existing generator, transaction, idempotency, reason codes, target minutes, plan shape and
persistence are unchanged. One additive step was inserted: **only when the dog has at least one
completed training session**, the adaptive engine runs and, if it produces a `return-to-prerequisite`
or `reduce-difficulty` step, that lesson is promoted to primary. If the promoted lesson is already in
the recommender's shortlist that entry is used; otherwise a primary item is synthesised for it with
the existing `REINFORCEMENT_DUE` reason code (the lesson is already known eligible).

With no session history the code path is skipped entirely and plan output is byte-identical to
Milestone 11. This is why the pre-existing daily-plan generation tests still pass unmodified.

### Progress — `adaptiveProgressInsight()`

A pure function over the skill records the existing Dog Learning Passport already derives. It
requires **≥3 completed sessions** for a skill before making any claim, uses a ≥70% success ratio for
"improving" and <50% for "needs more practice", and returns `null` when the evidence does not support
a statement. Progress itself is not rebuilt.

### Assessment → history transition

`AdaptiveEvidenceLevel` makes the handover explicit. With no sessions, recommendations are driven by
assessment priorities, prerequisites and curriculum ordering. As sessions accumulate, outcome-derived
factors (struggle, progression, recent practice penalty) grow to outweigh the static assessment
component. The assessment is never rewritten or replaced.

### New dog

A dog with no history gets: profile (age gating), life stage, assessment priorities, prerequisite
rules and curriculum ordering. No historical performance is implied — `recentSignalsByLesson` is
simply empty and every history-derived factor is absent rather than defaulted.

## Known limitations

- Per-step and per-repetition Success / Try Again taps are **not persisted** by the production
  session flow, so the engine reasons at session granularity. "Struggled on step 3" is not derivable
  and is not claimed.
- `LessonProgress.currentDifficultyAdjustment` remains unused; the engine does not read or write it.
- No environment/distraction level is recorded for lesson sessions, so environmental guidance is
  offered as approved advice rather than inferred from where training actually happened.
- Recency uses the newest 10 completed sessions; older history informs completion counts but not the
  struggle signals.
