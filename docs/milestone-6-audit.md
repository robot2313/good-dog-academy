# Milestone 6 audit

## Baseline inspected

- GitHub clone through Milestone 5.1.
- Extracted Milestone 6.1 checkpoint.
- Full Deterministic Daily Plan Engine specification supplied on 22 July 2026.

## Milestone 6.1 already contains

- A pure `DailyPlanRecommendationService` with stable score and ID tie-breaking.
- Reuse of `LessonEligibilityService` for activity, age, prerequisite, and progress eligibility.
- Ranking from BehaviourProfile skill scores, unknown skills, in-progress state, unsuccessful attempts, and reinforcement recency.
- A default 15-minute limit, configurable limits, skill variety, and five focused unit tests.
- Initial milestone notes and project-state documentation.

## Full Milestone 6 gaps at audit time

- The persisted `DailyPlan` is still the legacy `date`/`lessonIds` model and has no owner, timezone, target, focus, typed items, source assessment, or generated timestamp.
- Legacy statuses include `scheduled` and `in-progress` instead of the required `planned`, `completed`, and `skipped` values.
- No validator enforces exactly one primary item, at most one reinforcement, primary-first ordering, unique lessons, two-item maximum, or supported time budgets.
- No schema migration upgrades existing stored plans.
- No service loads and verifies Owner, Dog, current BehaviourProfile, and the latest valid profile-linked BehaviourAssessment.
- No generator uses recent DailyPlan history to rotate content.
- No same-dog/local-date idempotency or transactional persistence exists.
- No application-level service instance uses the bundled catalogue and 15-minute default.
- Ownership deletion already includes DailyPlan records and should be retained and tested with the upgraded owner-aware model.

## Checkpoint plan

1. **6.2A — persistence foundation:** production model, validator, migration 4→5, repository query contract, fixtures, and tests.
2. **6.2B — deterministic generation:** verified aggregate loading, age calculation, history-aware selection, item construction, same-day reuse, and atomic save.
3. **6.2C — application integration:** bundled-catalogue service instance, default 15-minute entry point, documentation, and full regression verification.

Excluded UI, lesson-session, dashboard, achievements, subscriptions, authentication, AI, and backend work remains out of scope.
