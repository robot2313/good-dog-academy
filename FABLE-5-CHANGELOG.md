# Fable 5 whole-app exact-style changelog

## Verification (all run on this exact tree)

- TypeScript: clean (`tsc --noEmit`)
- Jest: 73/73 suites, 508/508 tests
- Expo Doctor: 18/18 checks passed
- Visual proof: 18 screenshots captured from the running app at 390x844 —
  six master screens, five lesson-flow states, help sheet, and secondary
  flows — reviewed against docs/exact-screen-references/ and documented in
  docs/fable-visual-proof/COMPARISON.md

## Rebuilt at JSX level

- **Guided lesson session (all phases)**: Before You Begin is photo-led with
  reference cards and circle icons; active practice adds a compact photo
  strip and an always-available "This isn't working?" help sheet built from
  the lesson's existing support content; completion shows a green check
  mark, session stats, and a progress card. All handlers, labels, and
  accessibility text preserved.
- **Step-visual data model** (`lessonStepVisuals.ts`): every step can attach
  setupImage, closeUpImages[], correctImage/avoidImage, overlayAnnotations,
  demonstrationVideo, spokenInstruction. Rendered in the active step list
  when present. Registry ships empty — per-step photography is candidly
  listed as missing in COMPARISON.md.
- **Troubleshooter**: choice cards became reference list rows with chevrons.
- **Welcome**: photo-led with green check bullet points.
- **LessonThumbnail**: dark tone + dark skill pill removed; clean bordered
  photo at 64px.
- **LessonCompletionCelebration**: Continue button squared to the 9px
  reference radius.
- **Web-safe card photos**: side photos on Home's three cards and the four
  Life Stage cards are now frame + absolute-fill (`cardSideImageFill`), fixing
  a genuine layout bug where portrait photos stretched cards to full-page
  height (caught by visual verification, invisible to Jest).

## Tooling added

- `scripts/capture-visual-proof.mjs`: drives the Expo web export through real
  onboarding, assessment, all six masters, and the full lesson flow with
  puppeteer, saving the proof screenshots. Run:
  `npx expo export --platform web`, serve `dist/` on :8787, then
  `node scripts/capture-visual-proof.mjs`.
- `react-native-web` + `react-dom` added via `npx expo install` so the web
  export used for visual verification builds; versions are Expo-aligned and
  Expo Doctor passes 18/18 with them present.

## Not changed

Lesson content and IDs (all 60), photographs and the realistic-only guard,
Journey recommendation logic, self-directed browsing, life-stage collections,
progress/passport/history, onboarding and assessment logic, troubleshooter
decision logic and safety overrides, privacy and deletion, persistence and
migrations. No test was weakened; no behaviour test was modified.
