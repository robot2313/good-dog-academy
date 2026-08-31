# Recovered Milestone 12–14 artifacts (PARTIAL)

## What this is

The development machine holding Milestones 12, 13 and 14 was lost. Those milestones
were **never pushed** to this repository — the furthest work that reached GitHub is
`feature/milestone-11-curriculum-expansion` (`c3eb717`).

The files in this directory are the artifacts that survived, recovered one at a time
through a chat session and committed here so they are backed up. They are stored
**verbatim, under a recovery path**, deliberately *not* merged into the working tree —
several are Milestone-14-era versions of root files (`package.json`, `App.tsx`,
`tsconfig.json`, `app.json`) and must not silently overwrite the Milestone 11 code
until someone deliberately reconciles them.

**Nothing here is wired into the build.** This is a backup, not an integration.

## What survived

### Milestone 12 documentation (complete set)
- `MILESTONE-12-CHANGELOG.md` — file-by-file list of everything M12 added/changed
- `MILESTONE-12-ADAPTIVE-ENGINE.md` — full spec: scoring factors, point values,
  thresholds, tie-break order, integration points
- `MILESTONE-12-AI-SAFETY.md` — risk classifier categories, humane-policy reject list,
  provider pipeline and fallback guarantees
- `MILESTONE-12-DATA-AUDIT.md` — map of every source of truth in the codebase

### Design / release documentation
- `WHOLE-APP-REFERENCE-STYLE-CONTRACT.md` — the FABLE-5 whole-app visual contract
- `docs/privacy-policy.md`
- `docs/store-submission-metadata.md` — v1.0.0 store submission draft

### Tooling
- `scripts/generateLessonImages.ts` — lesson-image generation CLI (fal / OpenAI),
  dry-run by default, reads keys only from env
- `scripts/capture-milestone-12-proof.mjs`
- `scripts/capture-assessment-proof.mjs` — note: outputs to
  `docs/milestone-14-visual-proof/`, indicating Milestone 14 covered the
  behaviour-assessment flow
- `scripts/capture-visual-proof.mjs`

### Root configuration (Milestone 14 era)
`package.json`, `package-lock.json`, `app.json`, `tsconfig.json`, `App.tsx`,
`jest.config.js`, `jest.setup.js`

### Tests
`tests/components/statusPill.test.tsx`, `tests/components/appModal.test.tsx`
(both already exist on the Milestone 11 branch; kept here for completeness)

## What is STILL MISSING

The actual feature source code for Milestones 12–14 was **not** recovered:

- `src/features/adaptive/` — 9 files (training state, recommendation engine,
  difficulty guidance, explanations, progress insight, query service, hook, barrel)
- `src/features/coach/` — 8 files (coach types, safety classifier, deterministic
  coach, service, context builder, instance, panel, barrel)
- `src/features/lessons/coaching/lessonImageGenerationData.ts` — required by
  `scripts/generateLessonImages.ts`; that script will not run without it
- The 7 Milestone 12 test suites (54 tests)
- All Milestone 13 code and documentation (nothing at all was recovered)
- All Milestone 14 source (only the assessment proof script survived)

A `good-dog-academy-milestone-14.zip` (48.6 MB) containing this source is known to
exist on a personal device but could not be transferred: it exceeds the chat upload
limit, and the `src/features`, `src/domain` and `src/development` folders could not be
read due to an iOS Files permission fault on the extracted archive.

## If the zip is recovered later

Upload `src/` and `tests/` from that archive. The Milestone 12 documentation above is
detailed enough to verify the restored code matches its specification. Reconcile the
root config files in this directory against the Milestone 11 branch before adopting
them.

## Rebuilding instead

If the source is never recovered, Milestone 12 can be faithfully reconstructed from
`MILESTONE-12-ADAPTIVE-ENGINE.md` and `MILESTONE-12-AI-SAFETY.md`, which specify every
file, factor, threshold and integration point. Milestones 13 and 14 have no equivalent
specification and would need to be redesigned.
