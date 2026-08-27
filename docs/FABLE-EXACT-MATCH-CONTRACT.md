# Fable 5 — Exact Screen Match Contract

## The instruction is literal

The app must be rebuilt so screenshots of the running app look like the six phone screens in:

- `docs/REFERENCE-PRIMARY-EXACT.png`
- `docs/exact-screen-references/00-six-screens-exact-strip.png`
- the six individual screen crops in `docs/exact-screen-references/`

This is not a mood board. It is the layout specification.

Do not reinterpret the design. Do not replace it with large dashboard cards, a different tab system, a dark hero, a different screen hierarchy, or a token-only redesign.

## Exact menu/navigation contract

The persistent bottom navigation must read, in this order:

1. Home
2. Journey
3. Categories
4. Dogs
5. Progress

Use compact icon-above-label tabs exactly like the reference. Do not use Today, Library, Academy, Profile, or any other labels in the five main tab slots.

Profile, settings, privacy, troubleshooting, assessment, session history, and photo editing must remain available through header/menu routes without changing the five main tabs.

## Exact screen contract

### Home — match `01-home.png`

From top to bottom:

- small hamburger menu at top left
- small notification bell at top right
- time-aware greeting
- owner and dog names on a bold second line
- circular dog photo aligned to the right of the greeting block
- compact section title `Today's Plan`
- horizontal lesson card with photo on the left, lesson copy on the right, and green `Continue Lesson` button
- compact `Recommended for You` section with `See all` on the right
- one horizontal recommendation card
- compact `Jump Back In` section with `See all`
- one horizontal in-progress lesson card with progress bar and percentage
- `Browse by Category`
- one horizontal row of circular category buttons, including a More button
- bottom tabs

Do not use oversized navigation tiles on Home.

### Categories — match `02-categories.png`

- title `Categories`
- subtitle `Explore training topics`
- ten compact white rows
- icon left, category name centre-left, `6 lessons` right
- consistent small radius, thin warm border and tight vertical spacing
- bottom tabs with Categories active

### Lessons in Category — match `03-lessons-in-category.png`

- category colour/icon tile in top-left content area
- category title and lesson count beside it
- wide 16:9-ish realistic category photograph directly below
- two-line category description
- compact pills: All, Beginner, Intermediate, Advanced
- six tightly stacked lesson rows
- each row: thumbnail left, lesson number/title/level, chevron right
- bottom tabs with Categories active

### Lesson Detail — match `04-lesson-detail.png`

- large photograph from the very top of the screen, approximately 35–40% of viewport height
- circular back control over image top-left
- circular bookmark control over image top-right
- title immediately below the image
- two compact metadata pills for level and duration
- description
- `You will learn` heading
- four short rows with green check icons
- full-width green `Start Lesson` button above the safe-area edge
- no bottom tab bar on this pushed detail screen

### Your Journey — match `05-your-journey.png`

- title `Your Journey`
- subtitle `Your personalised path to success`
- vertical green line on the left with outlined circular stage markers
- four stacked stage cards: Foundation, Building Skills, Real World, Lifelong Skills
- current stage expanded with lesson rows
- completed lesson rows use green checks
- current lesson uses pale-green highlight
- future lesson shows grey lock
- full-width green `View Full Journey` button
- bottom tabs with Journey active

### Training by Life Stage — match `06-life-stage.png`

- title `Training by Life Stage`
- subtitle `Choose your dog's stage`
- four large stacked cards: Puppy, Adult Dog, Senior Dog, Rescue Dog
- photograph occupies the left 45–50% of every card
- text block on right with stage name, age range and short description
- chevron at far right
- bottom tabs with Dogs active

## Exact visual rules

- Background: warm off-white/cream, not pure white and not green-tinted.
- Cards: white, fine warm-grey border, very subtle shadow, compact 10–14 px radius.
- Primary text: dark navy/near-black.
- Primary action: medium forest green.
- Current progress highlight: pale green.
- Avoid oversized headings, oversized radii, pills everywhere, dark hero panels, decorative gradients, and excess whitespace.
- Density must be compact enough that the same number of cards/rows visible in the reference fit on an ordinary phone screen.
- Use existing high-resolution realistic photographs in the exact image slots and aspect ratios shown. Do not use the low-resolution embedded mockup photos as production assets.
- No cartoons or illustrated dogs.

## Measurement rule

Use the individual screen crops as proportional overlays while implementing. Render at a consistent phone viewport, compare side-by-side, and tune:

- top offsets
- horizontal padding
- card heights
- image aspect ratios
- row heights
- font sizes and weights
- section spacing
- tab-bar height

A screen is not approved merely because it contains the same sections. The placement and proportions must be visibly close.

## Required proof

Create these screenshots from the running implementation and include them in `docs/fable-visual-proof/`:

- `01-home-implemented.png`
- `02-categories-implemented.png`
- `03-lessons-in-category-implemented.png`
- `04-lesson-detail-implemented.png`
- `05-your-journey-implemented.png`
- `06-life-stage-implemented.png`

Also create `docs/fable-visual-proof/COMPARISON.md` describing any remaining visual differences. Do not claim an exact match if meaningful differences remain.
