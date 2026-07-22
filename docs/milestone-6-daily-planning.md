# Milestone 6 — Personalised Daily Planning

## Goal

Turn the validated lesson catalogue into a deterministic, personalised answer to: **What should this dog train today?**

## Delivery slices

- **6.1 Recommendation engine:** rank eligible new-learning and reinforcement lessons using assessment scores, progress state, practice need, recency, age, prerequisites, time limits, and skill variety.
- **6.2 Persistence foundation:** production model, typed items, validator invariants, ownership, and schema migration.
- **6.3 Deterministic generation:** latest valid assessment, current profile, dog age, eligibility, progress, recent-plan rotation, local day, transactional persistence, and same-day reuse.
- **Deferred:** completion/skipping interactions and the final Today/Home UI are explicitly outside this milestone.

## 6.1 rules

1. Only the existing `LessonEligibilityService` may decide whether content can be considered.
2. Lower assessed skill scores receive greater priority.
3. In-progress lessons outrank untouched available lessons.
4. Lessons with unsuccessful practice history receive a bounded boost.
5. Completed lessons are reinforcement only; older completions receive a bounded recency boost.
6. A plan contains exactly one primary item and at most one reinforcement item, with no duplicate lesson.
7. Selection is deterministic and stable by score, duration, and lesson ID.
8. The first useful lesson may exceed the target duration; subsequent lessons may not.
9. Recommendation remains pure; `DailyPlanGenerationService` owns the single transactional write.
10. Supported targets are 5, 10, 15, 20, and 30 minutes; application integration defaults to 15.
11. One persisted plan is reused per Owner, Dog, and local calendar date.
12. Recent plan history applies a deterministic rotation penalty without overriding eligibility.
