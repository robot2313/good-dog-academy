# Good Dog Academy — Fable 5 Exact Six-Screen Rebuild

## Read this before touching code

The current app's functionality is valuable, but its screen layouts are not approved.

Your task is to recreate the six running mobile screens shown in `docs/REFERENCE-PRIMARY-EXACT.png` as closely as practical. This reference is a literal UI specification, not inspiration.

Immediately read:

1. `docs/FABLE-EXACT-MATCH-CONTRACT.md`
2. `docs/WHOLE-APP-REFERENCE-STYLE-CONTRACT.md`
3. `docs/LESSON-EXPERIENCE-VISUAL-CONTRACT.md`
4. `docs/exact-screen-references/00-six-screens-exact-strip.png`
5. all six individual crops in `docs/exact-screen-references/`

## Non-negotiable result

The six supplied screens are the master templates, and **every other screen in the app must visibly belong to the same product**. Do not make only those six screens match while leaving onboarding, assessment, training sessions, troubleshooting, progress, profile, privacy, history, or secondary routes in a different design system.

The implementation must match the reference in:

- screen structure
- section order
- menu names
- bottom-tab order
- image placement
- image proportions
- card sizes
- row density
- spacing
- typography hierarchy
- green/cream/white visual system

Do not perform a token-only redesign. Do not preserve an old layout merely because changing it is more work. Rebuild the relevant JSX and reusable components. Apply the same compact cream/white/green reference language to the entire app, including every lesson screen and every lesson phase.

## Five main tabs — exact order

- Home
- Journey
- Categories
- Dogs
- Progress

Do not substitute Today, Library, Academy or Profile in these five slots. Keep those functions accessible through secondary routes where needed.

## Preserve all functionality

Keep:

- all 60 lessons and IDs
- lesson photographs and realistic-only guard
- Journey recommendation logic
- self-directed category browsing
- recommended lessons
- Puppy, Adult Dog, Senior Dog and Rescue Dog collections
- progress, passport and history
- onboarding and dog profile
- troubleshooter and `This isn't working`
- assessment
- privacy and local data deletion
- persistence and migrations
- accessibility

Do not rewrite business logic to make the UI easier.

## Production photographs

Use the project's existing high-resolution realistic photographs in the exact slots shown by the reference. The reference's embedded photos are layout examples and are too low resolution to become production assets.

## Whole-app and lesson verification is mandatory

In addition to the six master screens, capture and review at least these secondary flows:

- onboarding welcome and dog setup
- recommended lessons
- progress/passport
- profile
- troubleshooter
- assessment
- lesson Get Ready
- lesson instruction step
- active practice/timer
- lesson feedback
- lesson completion

Every one must clearly use the same spacing, card language, typography, buttons, image treatment, headers, and navigation rules.

## Visual verification is mandatory

Types and tests do not prove visual success.

Before return:

1. Run the app at a consistent phone viewport.
2. Capture all six target screens.
3. Compare them against the matching individual reference crops.
4. Iterate until layout, density and proportions visibly match.
5. Save proof in `docs/fable-visual-proof/` using the filenames required by the contract.

## Verification gates

Run sequentially:

```powershell
npm.cmd run typecheck
npm.cmd test
npx.cmd expo-doctor
```

Required:

- TypeScript clean
- 73/73 suites
- 508/508 tests
- Expo Doctor 18/18
- 60 realistic lesson photographs
- no legacy cartoon category images

Update only tests directly affected by approved visible UI changes. Do not weaken safety or behaviour tests.

## Deliverable

Return one complete updated project ZIP, not a patch. Include:

- full source and assets
- all updated tests
- six master-screen visual-proof screenshots
- secondary-flow screenshots proving the whole app and lesson flow use the same style
- `FABLE-5-CHANGELOG.md`
- verification results
- a candid list of any visual differences still remaining
