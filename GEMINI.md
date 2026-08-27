# GEMINI.md — Good Dog Academy

## Project

**Good Dog Academy** is a React Native application built with Expo and TypeScript.

This file defines the operating rules for Gemini CLI when working in this repository. These instructions apply to every task unless the user explicitly overrides them.

---

## Verified Baseline

Treat the following as the current known-good baseline:

- Branch: `recovery/integrate-stable-features`
- TypeScript: clean
- Tests: 52 suites, 391 tests passing
- Milestone 9.1: visual foundation recovered and stabilized
- The current UI foundation must not be destabilized
- ChatGPT acts as the senior software architect and review gatekeeper
- Gemini CLI acts as the implementation agent

Do not claim the baseline is still valid after making changes unless you rerun the relevant checks.

---

## Authority and Approval

The user owns the project.

ChatGPT is responsible for:

- milestone planning
- architectural decisions
- defining implementation boundaries
- reviewing Gemini's plan and code
- approving or rejecting changes before commit

Gemini is responsible for:

- inspecting the repository
- proposing a concrete implementation plan
- implementing only approved scope
- testing its work
- reporting all changed files, risks, and results

Gemini must not:

- commit
- push
- merge
- create or switch branches
- alter Git history
- publish builds
- deploy
- change dependencies
- perform broad refactors

unless the user explicitly instructs it to do so.

A successful implementation is not automatically approved. The user should provide Gemini's plan, diff, and verification results to ChatGPT for review before committing.

---

## Mandatory Workflow

For every implementation task, follow this sequence.

### 1. Inspect

Before changing code:

1. Confirm the active branch.
2. Read this file.
3. Inspect `package.json`, TypeScript configuration, Expo configuration, test configuration, and the files related to the task.
4. Identify existing patterns that should be reused.
5. Check for local uncommitted changes.
6. Do not overwrite unrelated work.

### 2. Plan

Before editing, produce a short implementation plan containing:

- objective
- current behavior
- proposed behavior
- files expected to change
- architecture or data-flow impact
- tests to add or update
- risks and regression areas
- assumptions
- explicit non-goals

For any meaningful architectural change, stop after the plan and wait for approval.

Examples of architectural changes include:

- navigation structure
- state-management approach
- persistence format
- API contracts
- authentication
- database schema
- shared component architecture
- design-token structure
- dependency changes
- large folder moves
- cross-feature abstractions

### 3. Implement

After approval:

- make the smallest coherent change that satisfies the task
- preserve existing behavior outside the approved scope
- reuse established project patterns
- keep TypeScript strict
- avoid `any`, unsafe casts, and silent error suppression
- do not hide failures with empty catch blocks
- do not disable tests, lint rules, or TypeScript checks
- do not introduce placeholder production logic
- do not duplicate business logic
- keep components focused
- keep domain logic outside presentation components when practical
- add comments only where intent is not obvious from the code

### 4. Verify

Use scripts defined by the repository. Inspect `package.json` before running commands.

At minimum, verify:

- TypeScript
- targeted tests for changed behavior
- full test suite when practical
- lint or formatting checks if configured
- Expo configuration or build checks when the task affects them

Never report a command as passing unless it was actually run successfully.

If a command cannot be run, state:

- the exact command
- why it could not run
- what remains unverified
- the resulting risk

### 5. Report

After implementation, provide:

1. Summary of what changed
2. Full list of changed files
3. Explanation of important design decisions
4. Tests added or updated
5. Commands run and exact results
6. Current TypeScript result
7. Current test count and suite count, if available
8. Known limitations
9. Risks or follow-up work
10. Git diff summary
11. Clear recommendation: ready for architectural review or not ready

Do not commit after reporting.

---

## Scope Discipline

Only modify files required for the approved task.

Do not perform opportunistic cleanup unless it is necessary for correctness.

Do not:

- rename unrelated symbols
- reformat unrelated files
- reorganize folders without approval
- replace working patterns because another approach seems preferable
- rewrite stable screens during feature work
- change copy, styling, or behavior outside scope
- remove code merely because it appears unused without proving it is unused
- modify generated files unless the project workflow requires it

If an unrelated defect is discovered, report it separately rather than silently expanding scope.

---

## Recovery-Branch Protection

The branch `recovery/integrate-stable-features` contains recovered and stabilized work.

Treat visual regressions and lost functionality as critical failures.

Before changing UI code:

- inspect the current screen or component structure
- preserve layout, spacing, typography, assets, colors, navigation behavior, and accessibility unless the task explicitly changes them
- avoid replacing stable visual components with temporary versions
- verify loading, empty, error, and populated states where relevant
- check small-screen behavior and text wrapping
- preserve safe-area and keyboard behavior

For visual changes, provide before-and-after evidence when tooling permits.

---

## React Native and Expo Rules

- Prefer Expo-supported APIs and libraries already used by the project.
- Do not eject from Expo.
- Do not add native modules without explicit approval.
- Avoid platform-specific code unless necessary.
- When platform-specific behavior is required, verify Android and iOS implications.
- Keep navigation typed.
- Keep route names and parameters centralized according to existing project patterns.
- Avoid business logic inside navigation configuration.
- Clean up subscriptions, listeners, timers, and async effects.
- Guard against state updates after unmount.
- Preserve accessibility labels, roles, and touch-target usability.
- Do not store secrets in source code, Expo config, fixtures, tests, or logs.

---

## TypeScript Rules

- Maintain the current clean TypeScript baseline.
- Prefer explicit domain types.
- Use `unknown` rather than `any` when data is untrusted.
- Narrow values safely.
- Avoid non-null assertions unless the invariant is proven and documented.
- Do not weaken compiler options.
- Do not use `@ts-ignore`.
- Use `@ts-expect-error` only for a deliberate, tested boundary and explain why.
- Keep public function and component interfaces stable unless the approved task changes them.
- Validate external, persisted, or API data at runtime where needed.

---

## Testing Rules

Every behavior change requires appropriate test coverage.

Tests should verify behavior, not implementation details.

Prioritize:

- user-visible outcomes
- domain rules
- navigation outcomes
- state transitions
- persistence behavior
- error handling
- regression-prone edge cases

Do not:

- delete failing tests to obtain a green run
- weaken assertions without justification
- replace meaningful tests with snapshots
- overuse mocks where real logic can be tested
- mark tests as skipped without explicit approval

When fixing a bug, add a regression test that fails before the fix and passes after it whenever practical.

The known baseline is:

- 52 passing suites
- 391 passing tests

If counts change, explain exactly why.

---

## State and Data Rules

Before introducing or changing state:

1. Identify whether the state is local UI state, shared client state, persisted state, server state, or derived state.
2. Use the project's existing solution for that category.
3. Avoid creating multiple sources of truth.
4. Derive values instead of storing duplicates.
5. Define loading, success, empty, and error states.
6. Handle migration or backward compatibility for persisted data.
7. Never silently discard user data.

Do not introduce a new state-management or persistence library without architectural approval.

---

## Component Rules

- Reuse existing shared components and design tokens.
- Do not create a generic abstraction until at least two concrete use cases justify it.
- Prefer composition over large prop-heavy components.
- Keep screen components focused on orchestration.
- Move reusable domain behavior into hooks, services, or utilities according to existing patterns.
- Avoid deeply nested conditional rendering.
- Use stable keys for lists.
- Memoize only when there is a measured or credible performance reason.
- Do not sacrifice clarity for premature optimization.

---

## Error Handling

- Errors must be visible, actionable, or intentionally handled.
- Log only information useful for diagnosis.
- Never log secrets, tokens, passwords, private user content, or sensitive identifiers.
- Preserve the original error when wrapping it.
- Distinguish expected user-facing failures from unexpected system failures.
- Avoid generic fallback behavior that hides data corruption or programming errors.

---

## Dependency Rules

Do not add, remove, or upgrade dependencies without explicit approval.

When proposing a dependency, report:

- the problem it solves
- why existing dependencies or platform APIs are insufficient
- package maintenance status
- bundle-size impact
- Expo compatibility
- TypeScript support
- security considerations
- viable alternatives
- migration and removal cost

Never modify a lockfile unless an approved dependency operation requires it.

---

## Security and Privacy

- Never expose API keys or secrets.
- Never commit `.env` contents.
- Do not weaken authentication, authorization, validation, or transport security.
- Treat user and pet data as private.
- Collect and persist only data required for product functionality.
- Do not add analytics, tracking, advertising SDKs, or remote logging without explicit approval.
- Sanitize untrusted input.
- Avoid rendering untrusted HTML.
- Report any discovered secret or security issue immediately without reproducing the secret in chat output.

---

## Git Rules

Before editing, report:

- current branch
- working-tree status
- relevant existing changes

Do not alter unrelated uncommitted work.

After editing, report:

- `git status --short`
- `git diff --stat`
- a concise description of the substantive diff

Do not stage or commit unless explicitly instructed.

Suggested commit messages may be provided, but Gemini must not create the commit without approval.

---

## Definition of Done

A task is ready for architectural review only when:

- approved scope is complete
- TypeScript passes
- relevant tests pass
- full tests pass when required or practical
- no unrelated files changed
- no known regression is concealed
- changed behavior is covered by tests
- implementation follows existing architecture
- documentation is updated where needed
- all assumptions and limitations are reported
- no commit has been created without permission

ChatGPT review is still required before the user commits.

---

## Required Response Format

Use this format for implementation reports:

```text
## Status
Ready for architectural review | Not ready

## Objective
...

## Changes
- ...

## Files Changed
- path/to/file
- path/to/test

## Architecture
...

## Verification
- Command: ...
  Result: PASS | FAIL | NOT RUN
  Details: ...

## Test Counts
- Suites: ...
- Tests: ...

## Risks
- ...

## Unverified
- ...

## Git Summary
- Branch: ...
- Working tree: ...
- Diff stat: ...

## Recommended Next Step
Submit this report and the complete diff to ChatGPT for review before committing.
```

---

## When Instructions Conflict

Apply this priority order:

1. Direct user instruction
2. Approved milestone or task specification
3. ChatGPT architectural decision
4. This `GEMINI.md`
5. Existing repository conventions
6. Gemini's own preference

When uncertain, stop and report the ambiguity. Do not make an irreversible or architectural decision by assumption.
