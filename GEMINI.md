# GEMINI.md — Good Dog Academy

## Project

**Good Dog Academy** is a professional dog-training mobile product with an existing React Native/Expo codebase and an active Flutter migration/perception workstream.

This file defines operating rules for implementation agents working in this repository. These instructions apply to every task unless the owner explicitly overrides them.

---

## Canonical Product and Technical Authority — READ FIRST

Before proposing or implementing meaningful work, read:

`GOOD_DOG_ACADEMY_SOURCE_OF_TRUTH.md`

That document is the project's **canonical product + technical north star / main bible**. It defines the perception architecture, scientific boundaries, accuracy principles, development phases, and authoritative next-task ordering.

Every task must identify which of the following it is:

- roadmap work that advances the source-of-truth architecture;
- a verified defect/regression fix;
- test/build/release infrastructure required to prove or deliver roadmap work;
- an explicit owner-directed exception.

If a task is none of those, do not implement it merely because it is interesting, fashionable, or convenient.

For roadmap work, report the exact phase/ranked task being advanced, the metric expected to improve, how it will be verified, and what dependency comes next.

Do not casually edit `GOOD_DOG_ACADEMY_SOURCE_OF_TRUTH.md`. A strategic change requires deliberate owner instruction.

---

## Live Baseline Requirement

Do **not** assume an old branch name, old test count, or historical milestone note is still the current baseline.

At the start of every task:

- confirm the active branch and exact HEAD;
- inspect the working tree;
- read `GOOD_DOG_ACADEMY_SOURCE_OF_TRUTH.md`;
- inspect the current relevant project-state and implementation files;
- identify whether the task concerns React Native, Flutter, shared documentation, CI/builds, model assets, or another workstream;
- preserve verified working behaviour outside scope;
- never modify `main` unless the owner explicitly instructs it.

Do not claim a baseline is valid after making changes unless the relevant checks were rerun.

---

## Authority and Approval

The user owns the project.

ChatGPT is responsible for:

- milestone planning;
- architectural decisions;
- defining implementation boundaries;
- reviewing plans and code;
- approving or rejecting changes before merge/release when requested.

Implementation agents are responsible for:

- inspecting the repository;
- aligning work with the canonical source of truth;
- proposing a concrete implementation plan;
- implementing only approved or directly instructed scope;
- testing work;
- reporting all changed files, risks, evidence, and results.

Unless the user explicitly instructs otherwise, implementation agents must not:

- merge;
- modify `main`;
- alter Git history;
- publish builds;
- deploy;
- make unrelated dependency changes;
- perform broad speculative refactors.

A successful implementation is not automatically product-approved. Verification must match the task's risk.

---

## Mandatory Workflow

For every implementation task, follow this sequence.

### 1. Inspect

Before changing code:

1. Confirm the active branch and exact HEAD.
2. Read this file.
3. Read `GOOD_DOG_ACADEMY_SOURCE_OF_TRUTH.md`.
4. Identify which roadmap phase/task, verified defect, infrastructure need, or owner exception justifies the work.
5. Inspect the relevant package/project configuration and files for the active workstream.
6. Identify existing patterns that should be reused.
7. Check for local/uncommitted changes.
8. Do not overwrite unrelated work.
9. If the task touches perception, establish the current model/runtime/benchmark state from live repository evidence rather than assumptions.

### 2. Plan

Before editing, produce a short implementation plan containing:

- objective;
- source-of-truth phase/task advanced;
- current verified behaviour;
- proposed behaviour;
- files expected to change;
- architecture or data-flow impact;
- metric(s) expected to improve;
- tests/benchmarks to add or update;
- risks and regression areas;
- assumptions;
- explicit non-goals.

For meaningful architectural changes not already authorized by the source-of-truth roadmap or direct owner instruction, stop after the plan and obtain approval.

Examples include:

- navigation structure;
- state-management approach;
- persistence format;
- API contracts;
- authentication;
- database schema;
- shared component architecture;
- design-token structure;
- dependency changes;
- large folder moves;
- cross-feature abstractions;
- perception architecture changes outside the canonical plan;
- changing model families/runtimes without benchmark evidence.

### 3. Implement

- make the smallest coherent change that satisfies the task;
- preserve existing behaviour outside the approved scope;
- reuse established project patterns;
- keep types strict;
- avoid unsafe casts and silent error suppression;
- do not hide failures with empty catches;
- do not disable tests, lint rules, analyzers, or type checks;
- do not introduce placeholder production logic;
- do not duplicate business logic;
- keep domain/perception logic outside presentation code where practical;
- preserve fail-closed/UNKNOWN behaviour for uncertain perception;
- do not replace a reliable component merely because a newer model/library exists;
- add comments only where intent is not obvious.

### 4. Verify

Use the scripts and tooling defined by the relevant project/workstream.

At minimum verify what is relevant to the changed scope:

- type/analyzer checks;
- targeted tests;
- full test suite when practical;
- lint/format checks if configured;
- model/decoder tests for vision changes;
- benchmark/regression evidence for perception changes;
- app/build checks when the task affects them;
- real-device testing requirements when desktop/CI evidence cannot prove behaviour.

Never report a command or benchmark as passing unless it was actually run successfully.

If a command cannot be run, state:

- the exact command/check;
- why it could not run;
- what remains unverified;
- the resulting risk.

### 5. Report

After implementation, provide:

1. Status.
2. Objective.
3. Source-of-truth phase/task advanced.
4. Summary of changes.
5. Full changed-file list.
6. Important design decisions.
7. Metrics/behaviour expected to improve.
8. Tests/benchmarks added or updated.
9. Commands run and exact results.
10. Current analyzer/type/test result.
11. Known limitations.
12. Risks and required physical-device checks.
13. Git diff summary.
14. Exact recommended next dependency from the roadmap.

---

## Scope Discipline

Only modify files required for the approved task.

Do not perform opportunistic cleanup unless necessary for correctness.

Do not:

- rename unrelated symbols;
- reformat unrelated files;
- reorganize folders without approval;
- replace working patterns because another approach seems preferable;
- rewrite stable screens during feature work;
- change copy, styling, or behavior outside scope;
- remove code merely because it appears unused without proving it;
- modify generated files unless the project workflow requires it;
- start side projects that do not advance the source-of-truth roadmap.

If an unrelated defect is discovered, report it separately rather than silently expanding scope.

---

## Perception-Specific Rules

For Camera Coach / vision / audio / temporal training work:

- Accuracy over novelty.
- Temporal evidence over single-frame guessing.
- UNKNOWN over confident error.
- Detection, tracking, pose, temporal understanding, rep counting, and coaching remain separable components.
- Do not add one-off posture heuristics as a substitute for the planned whole-body temporal model; geometry features are acceptable as measured inputs and temporary QA evidence.
- Do not treat a generic animal model as final simply because it runs.
- Do not select a model from marketing/COCO metrics alone; use GDA dog-disjoint benchmarks and real target phones.
- Preserve target-dog identity; never silently transfer a track to another dog.
- Keep detector confidence, tracking confidence, pose quality, posture confidence, and event confidence separate.
- Camera framing/visibility is part of the validity contract.
- Leash visual state is not exact tension; exact force requires a sensor.
- VLM/LLM output must not replace measured ground-truth event logic.
- Every perception result should have an uncertainty reason when abstaining.

---

## React Native / Expo Rules

For work that actually targets the React Native/Expo application:

- Prefer Expo-supported APIs/libraries already used by the project.
- Do not eject from Expo without explicit approval.
- Do not add native modules without explicit approval.
- When platform-specific behaviour is required, verify Android and iOS implications.
- Keep navigation typed.
- Clean up subscriptions, listeners, timers, and async effects.
- Guard against state updates after unmount.
- Preserve accessibility labels, roles, and touch-target usability.
- Do not store secrets in source, config, fixtures, tests, or logs.

Do not apply React Native rules mechanically to the Flutter migration.

---

## Flutter Rules

For Flutter migration/perception work:

- Treat the Flutter implementation as its own production workstream; do not rewrite working React Native code merely to imitate it.
- Keep domain/perception contracts platform-independent where practical.
- Keep camera/model/runtime integration behind replaceable interfaces.
- Preserve private QA/provisioning gates for experimental models until evidence supports promotion.
- Keep QA sessions separate from production training history where that separation already exists.
- Maintain clean analyzer output and appropriate unit/integration tests.
- Native platform bridges are acceptable when required for professional camera or inference performance.

---

## Type Safety Rules

- Maintain the current clean type/analyzer baseline for the active workstream.
- Prefer explicit domain types.
- Validate external, persisted, model, and API data at runtime where needed.
- Avoid weakening compiler/analyzer options.
- Avoid unsafe suppression mechanisms unless there is a documented and tested boundary.
- Keep public interfaces stable unless the approved task changes them.

---

## Testing Rules

Every behaviour change requires appropriate test coverage.

Tests should verify behaviour and contracts, not incidental implementation details.

Prioritize:

- user-visible outcomes;
- perception decoding/normalization;
- state transitions;
- rep-event rules;
- confidence/UNKNOWN behaviour;
- persistence;
- navigation outcomes;
- error handling;
- regression-prone edge cases;
- dog tracking loss/reacquisition;
- duplicate-rep prevention;
- model/runtime failure boundaries.

Do not:

- delete failing tests to obtain green;
- weaken assertions without justification;
- replace meaningful tests with snapshots;
- overuse mocks where real logic can be tested;
- mark tests skipped without explicit justification.

When fixing a bug, add a regression test that would have caught it whenever practical.

Do not hard-code historical test counts as current truth. Report the counts actually observed in the active workstream.

---

## State and Data Rules

Before introducing or changing state:

1. Identify whether it is local UI, shared client, persisted, server, model-derived, or event-history state.
2. Use the project's existing solution for that category where sound.
3. Avoid multiple competing sources of truth.
4. Derive values rather than storing duplicates when practical.
5. Define loading/success/empty/error/UNKNOWN states.
6. Handle migration/backward compatibility for persisted data.
7. Never silently discard user or dog-training data.

Do not introduce a new state-management or persistence library without architectural justification.

---

## Error Handling

- Errors must be visible, actionable, or intentionally handled.
- Log only information useful for diagnosis.
- Never log secrets, tokens, passwords, private user content, or sensitive identifiers.
- Preserve original errors when wrapping them where useful.
- Distinguish expected user-facing failures from unexpected system failures.
- Do not use fallback behaviour that hides corrupted data or invalid perception state.

---

## Dependency Rules

Do not add, remove, or upgrade dependencies without justification and appropriate approval for the task.

When proposing a dependency, report:

- problem solved;
- why existing dependencies/platform APIs are insufficient;
- maintenance health;
- licence/commercial implications;
- bundle/model-size impact;
- target-platform compatibility;
- security considerations;
- viable alternatives;
- migration/removal cost.

Do not modify lockfiles except as required by an approved dependency operation.

---

## Security and Privacy

- Never expose API keys or secrets.
- Never commit `.env` contents.
- Treat user, handler, pet, audio, image, and video data as private.
- Collect/persist only what product functionality requires.
- Active-learning clip capture requires explicit permission and privacy handling.
- Do not add analytics, advertising, remote logging, or cloud upload merely for convenience.
- Sanitize untrusted input.
- Report discovered security issues without reproducing secrets in chat output.

---

## Git Rules

Before editing, establish:

- current branch;
- exact HEAD;
- working-tree status;
- relevant existing changes.

Do not alter unrelated uncommitted work.

Do not modify `main` unless the owner explicitly instructs it.

After editing, report:

- branch/HEAD;
- status;
- diff stat;
- substantive diff summary;
- commit/push/build status if the user authorized those actions.

---

## Definition of Done

A task is complete only when:

- it is justified by the canonical source of truth, a verified defect, required infrastructure, or a direct owner instruction;
- approved scope is complete;
- relevant type/analyzer checks pass;
- relevant tests pass;
- full tests pass when required/practical;
- perception changes have appropriate benchmark/regression evidence;
- no unrelated files changed;
- no known regression is concealed;
- documentation is updated where needed;
- assumptions and limitations are reported;
- physical-device requirements are explicitly identified;
- the recommended next step follows the dependency chain rather than inventing a random new workstream.

---

## Required Implementation Report Format

```text
## Status
Ready | Not ready

## Objective
...

## Source-of-Truth Alignment
Phase/task: ...
Why this work is justified: ...

## Changes
- ...

## Files Changed
- ...

## Architecture / Data Flow
...

## Metrics Affected
- ...

## Verification
- Command/check: ...
  Result: PASS | FAIL | NOT RUN
  Details: ...

## Test / Benchmark Results
- ...

## Risks / Unknowns
- ...

## Physical Device Requirements
- ...

## Git Summary
- Branch: ...
- HEAD: ...
- Working tree: ...
- Diff stat: ...

## Recommended Next Dependency
...
```

---

## When Instructions Conflict

Apply this priority order:

1. Direct current owner instruction.
2. `GOOD_DOG_ACADEMY_SOURCE_OF_TRUTH.md`.
3. Specifically approved milestone/task specification that does not conflict with the source of truth.
4. Current verified project state and safety constraints.
5. This `GEMINI.md`.
6. Existing repository conventions.
7. Agent preference.

When uncertain, preserve working behaviour and report the ambiguity rather than inventing an architectural direction.
