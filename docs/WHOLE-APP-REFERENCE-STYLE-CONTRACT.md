# Whole-App Reference Style Contract

## One app, one visual system

The six supplied phone screens are the master design language for **the entire Good Dog Academy app**. They are not a separate mini-redesign for only Home and lesson discovery.

Every route must look as though it was designed at the same time by the same team. A user must never move from a compact cream/white/green screen into an old oversized dashboard, dark hero, pill-heavy interface, unrelated typography system, or generic form layout.

## Master visual language

Apply these rules throughout:

- warm cream/off-white screen background
- dark navy/near-black primary text
- forest-green primary actions and active states
- white compact cards with thin warm-grey borders
- subtle shadows only where necessary
- 10–14 px card radii; avoid giant rounded containers
- compact section spacing and row heights
- clear photo-led hierarchy
- small icon-above-label bottom tabs on main routes
- green full-width rectangular action buttons, not oversized pills
- restrained metadata pills only where the reference uses them
- no decorative gradients, dark hero banners, cartoon dogs, glass effects, or excessive empty space

Use shared primitives so visual consistency is structural, not a set of one-off patches.

## Navigation hierarchy

The five persistent tabs remain exactly:

1. Home
2. Journey
3. Categories
4. Dogs
5. Progress

Secondary functions must remain accessible without replacing those tabs:

- owner/dog profile
- settings
- notifications
- recommended lessons
- session history and details
- assessment
- troubleshooter and Help Me Now
- privacy/data deletion
- photo editing
- Today plan where still required by behaviour or tests

Main-tab screens show the compact tab bar. Pushed detail, form, training, assessment, and troubleshooting screens use a compact back header and no bottom tab bar unless the route genuinely remains at tab level.

## Whole-app screen mapping

### Onboarding

Welcome, owner setup, and dog setup must use the same cream background, compact white cards, forest-green buttons, realistic dog photography, short copy, and clear step progress. Do not use a visually unrelated marketing splash.

### Recommended lessons and Today plan

Use the same horizontal photo cards as Home. Keep thumbnails at the left, concise copy in the centre, metadata/progress beneath, and a small chevron or green action at the right/bottom. Avoid giant recommendation tiles.

### Progress, passport, and history

Use compact white stat cards, slim progress bars, small green check states, and stacked session rows. No dark progress hero, giant numbers, or oversized membership panels. Session detail should look like a pushed detail screen from the same app.

### Profile and dog settings

Use a compact identity header with circular dog photo, grouped white setting rows, small section labels, and green actions. Privacy and destructive actions remain clear but visually consistent.

### Troubleshooter and Help Me Now

Each question/result screen uses the same compact header, white option cards, realistic photo or small icon where useful, pale-green selected states, warm caution strips, and a fixed green next/action button. Do not turn this into a separate chatbot-style product.

### Assessment

Intro, question sections, and results must use the same cards, typography, progress indicator, and green actions. Keep one decision per screen where possible and maintain compact density.

### Privacy and data deletion

Use grouped white information cards and clear button hierarchy. Destructive actions may use restrained warning red but must still use the same radii, typography, and spacing.

### Loading, empty, and error states

Use compact centred content inside the same cream canvas. Small icon/realistic image, short title, short body, and one clear action. No unrelated full-screen illustrations.

## Reusable-component requirement

Create or consolidate reusable reference components for:

- page canvas/safe area
- compact back/header row
- identity header
- section title with optional `See all`
- horizontal photo lesson card
- compact list row
- stage card with left-side photo
- metadata chip
- progress bar
- primary and secondary buttons
- warning/help strip
- empty/loading/error states

Do not duplicate screen-specific styling when the same structure appears elsewhere.

## Whole-app visual proof

In addition to the six master screenshots, include screenshots of:

- onboarding welcome
- dog setup
- recommended lessons
- progress/passport
- profile
- troubleshooter question
- troubleshooter result
- assessment question
- assessment result
- privacy
- lesson Get Ready
- lesson step
- lesson practice/timer
- lesson feedback
- lesson completion

Save them in `docs/fable-visual-proof/secondary/` and list any remaining inconsistencies in `COMPARISON.md`.
