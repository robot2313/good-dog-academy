# Good Dog Academy — Project State

**Milestone 13 applies the approved reference design to every screen in the app, not just the original six. The design tokens themselves now define the reference scale, and a shared `IdentityHeader` (owner and dog name top left, tappable dog photo top right) appears across the app. Home, Categories, Lessons in Category, Lesson Detail, Journey, Training by Life Stage, Progress, Profile, Today's Plan, Lesson Library, Recommended, Session History, Session Detail, the Troubleshooter and Help Me Now flows, the Assessment flow, Privacy, and Onboarding all share one visual system. Final physical-device visual approval is still required.**

**Milestone 12 now matches the approved six-screen learning reference on `feature/milestone-11-curriculum-expansion`: Home, Categories, Lessons in Category, Lesson Detail, Journey, and Training by Life Stage. Bottom navigation is Home, Journey, Categories, Dogs, and Progress. The Dogs tab opens Puppy, Adult Dog, Senior Dog, and Rescue Dog collections; Profile remains available from Home. Final physical-device visual approval is still required.**

## Completed product experience

- Local Owner and Dog onboarding with optional managed dog photo
- Deterministic behaviour assessment and personalised training plan
- Sixty immutable reward-based lessons with search, filters, prerequisites, and journey states
- Guided lesson sessions, completion persistence, session history, and progress views
- Warm bone, forest, sage, and clay visual system with selected-dog identity and production lesson photography
- Adaptive Training Troubleshooter with thirteen topics, safety overrides, immediate exercises, fallback levels, saved outcomes, and a practical reference guide

## Milestone 10 completed

- Permanent iOS and Android identity: `com.robot2313.gooddogacademy`
- Production app icon, adaptive icon, and splash branding
- Explicit removal of unused microphone permission
- EAS internal-preview and production build profiles
- In-app privacy disclosure using `GoodDogAcademy1@gmail.com`
- Confirmed production deletion of every registered app storage key and managed dog-photo directory
- Atomic rollback if local record deletion cannot commit
- TypeScript, 70 Jest suites / 483 tests, Git whitespace validation, and Android Metro bundling all passed before commit `0748023`

## Milestone 11 curriculum expansion

- Added three lessons to every behaviour skill: one support lesson, one applied-practice lesson, and one maintenance lesson
- Preserved all 30 permanent existing lesson IDs and their original prerequisite chains
- Added 30 new permanent lesson IDs with measurable completion criteria, practical troubleshooting, and safety guidance
- Added image-generation specifications for all new lessons
- Locked runtime lesson imagery to photorealistic photographs only; legacy category cartoons are prohibited and test-guarded
- Added and wired 30 new realistic lesson photographs, giving all 60 active lessons a committed lesson-specific image; cartoon and illustrated runtime imagery remains prohibited and test-guarded
- Added independent lesson discovery: recommended lessons, ten category entry points, and curated puppy, adult, senior, and rescue-dog collections while keeping Journey as the personalised recommended path
- Added explicit self-directed lesson access so owners can choose any active age-appropriate lesson without waiting for Journey prerequisites; Daily Plan, age, activity, ownership, and data-integrity safeguards remain enforced
- Updated catalogue audits, library/coaching counts, architecture notes, store metadata, and authoring guidance for 60 lessons


## Milestone 12 reference UI redesign

- Rebuilt Home to match the approved hierarchy: Today’s Plan, Recommended For You, Jump Back In, and category shortcuts
- Rebuilt Categories as clean icon rows with lesson counts
- Rebuilt category lesson lists with a realistic hero, difficulty chips, and numbered lesson rows
- Rebuilt lesson detail with a full-width photograph, metadata, learning outcomes, and fixed Start Lesson action
- Rebuilt Journey as four visual recommended stages with completed, current, and upcoming states
- Rebuilt Dogs as Training by Life Stage with Puppy, Adult Dog, Senior Dog, and Rescue Dog cards
- Changed bottom navigation to Home, Journey, Categories, Dogs, and Progress
- Kept Profile accessible from Home and preserved all 60 lessons, self-directed access, progress, safety, and local data contracts

## Milestone 10.1 release gates

- Run Expo dependency-alignment and project-health checks
- Complete the full physical-device smoke test, including relaunch persistence and **Delete All App Data**
- Publish a public privacy-policy URL for App Store and Play listing metadata
- Create signed Android and iOS preview builds through the owner's Expo account
- Capture store-ready screenshots from signed builds
- Prepare store descriptions, age/content ratings, and privacy/data-safety declarations
- Fix release-blocking findings, rerun verification, and merge the approved release branch into `main`

The executable checklist is in `docs/milestone-10-1-release-candidate-checklist.md`.

## Deliberately deferred until after release

- Authentication and user accounts
- Cloud backup or multi-device sync
- Subscriptions and payments
- AI APIs, hosted video, analytics, or advertising


## Milestone 13 whole-app reference design

- Retuned `src/theme/tokens.ts` to the reference scale so every screen that
  consumes tokens converges automatically: radii cap at 14 (pills excepted),
  the type scale drops to the reference sizes, forest green becomes `#2F8148`,
  the accent role becomes forest green rather than gold, and shadows are
  reduced to the reference's near-flat elevation
- Added `src/components/IdentityHeader.tsx`: owner and dog names top left with a
  time-aware greeting, and the dog's photo top right. Tapping the photo opens the
  photo library and saves through the existing `dogPhotoUpdateService`, so the
  transactional replace/rollback rules are unchanged. It resolves identity from
  onboarding status first and falls back to the selected lesson-library dog
- Rethemed the shared primitives so untouched screens inherit the look:
  `AppScreen`, `AppBackHeader`, `AppButton` (52px rectangles at 9px radius, no
  pills), `PremiumCard` (white, 12px, hairline warm border), `SectionHeader`,
  `Metric`, `EmptyState`, `LoadingState`, `ErrorState`, `SecondaryTextButton`
- Added ~90 shared styles in `referenceScreenStyles` covering identity rows,
  data rows, stat tiles, notices, timelines, inputs, options, and session UI
- Rebuilt Progress, Profile, Session History, Session Detail, Recommended
  Lessons, and Privacy on the reference layout; the dark forest hero, membership
  and progress panels are gone in favour of light cards and stat tiles
- Brought the Troubleshooter, Help Me Now, Assessment, Onboarding, Lesson
  Library, and guided-session screens onto the same card, button, and type
  language; gold accents became forest green and caution surfaces were
  normalised to the reference warm strip
- The only dark surface remaining is the guided-session timer bar
- All 60 lessons, photography, progress logic, safety rules, and local data
  contracts are unchanged
- TypeScript passes clean, 73/73 Jest suites and 508/508 tests pass, and Expo
  Doctor reports 18/18 checks passed

## Milestone 13 test-suite repairs

Five failures were present in the working snapshot this milestone started from.
Each was fixed at its cause; no assertion was weakened or removed.

- **RNTL cleanup hang (`lessonLibraryScreen`)** — React Native Testing Library's
  automatic cleanup awaits `flushMicroTasks()`, which resolves through
  `setImmediate`. When Jest's modern fake timers own `setImmediate`, nothing
  advances that clock while the cleanup hook runs, so the hook hangs and Jest
  blames whichever test was mounted at the time. Reproduced deterministically on
  the third `SectionList` render in any fake-timer suite, independent of props or
  component. Fixed globally in `jest.config.js` with
  `fakeTimers: { doNotFake: ['setImmediate'] }`; `setTimeout`, `setInterval`, and
  `Date` are still faked
- **`lessonImageManifest`** — the ten legacy cartoon category images were still
  committed under `assets/lesson-images/*.jpg`, which the repository-hygiene test
  explicitly forbids. They were verified unreferenced (every runtime path resolves
  through `assets/lesson-images/by-lesson/`) and deleted. The image-safety
  assertions are untouched and no image mapping changed
- **`lessonThumbnail` (x2)** — the test expected the wording "lesson
  illustration" while the component correctly says "lesson photograph" under the
  photorealistic-imagery policy. The stale expectations were corrected; the
  application wording is preserved
- **`lessonDiscovery`** — the test expected `recall-one` as the third
  recommendation, but the recommender deliberately varies skills before adding a
  second lesson from a skill already selected. The stale expectation was
  corrected to `barking-one`; the recommendation behaviour is unchanged
