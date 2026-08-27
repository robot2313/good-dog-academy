# Lesson Experience Visual Contract

## Every lesson must look like part of the reference app

The Lesson Detail screen in the supplied reference is the visual foundation for the entire lesson experience. Every lesson phase must continue that same photo-led, compact cream/white/green design.

Do not stop after matching the Lesson Detail page. Rebuild the full lesson journey:

1. Lesson Detail
2. Get Ready / Before You Begin
3. Step-by-step instruction
4. Active practice
5. Help / This isn't working
6. Feedback
7. Completion

Pushed lesson screens do not show the bottom tab bar. They use compact overlay/back controls or a compact back header and a persistent bottom action area.

## Lesson Detail

Match the supplied reference:

- large realistic photograph at the top, around 35–40% of viewport height
- circular back and bookmark controls over the image
- lesson title directly below
- compact level and duration chips
- short description
- `You will learn` list with green checks
- full-width forest-green `Start Lesson` button

## Get Ready / Before You Begin

Use a similar photo-led screen:

- top realistic setup photograph
- small `Before you begin` label
- concise preparation title
- 2–4 compact setup rows for equipment, environment, reward, and safety
- a pale warm caution strip only when needed
- green `Start Lesson` button fixed near the bottom

Avoid long paragraphs. Break information into short visual rows.

## Step-by-step instruction screens

Each individual step should be its own clear screen or swipe/page state, not a wall of all steps.

Required structure:

- compact top row: back, `Step X of Y`, optional sound/help
- slim green progress line
- large realistic instructional image occupying approximately 35–45% of the screen
- short action title
- one plain-English instruction, ideally one sentence
- optional small `Why this works` line
- compact visual callouts below the image
- full-width green `Next` button

The layout must work for a first-time dog owner and a person with limited English.

## Exact visual instruction requirement

Each practical step must support multiple realistic visuals, not only one generic lesson thumbnail:

- full-body setup photograph showing owner and dog position
- close-up showing the exact reward hand and height
- close-up showing lead, harness, collar, foot, or body placement where relevant
- simple arrows/circles/labels over realistic imagery to show movement or position
- `Correct` and `Avoid this` comparison where a common mistake matters
- tap-to-enlarge image support
- optional spoken instruction
- short loop/video slot where movement cannot be shown accurately in one still

For example, never write only `hold the reward by your leg`. Show which hand, distance from the dog's nose, hand height, owner stance, dog's shoulder position, lead slack, and the moment the reward is delivered.

Do not use cartoons. Diagrams must be clean overlays on realistic photography or realistic anatomical/positional diagrams.

## Asset/data architecture

Implement a lesson-step visual model that can attach multiple assets to every step, such as:

- `setupImage`
- `closeUpImages[]`
- `correctImage`
- `avoidImage`
- `overlayAnnotations[]`
- `demonstrationVideo`
- `spokenInstruction`

Do not hardcode all visuals into one screen component. Existing lesson photographs may be used as temporary top images, but do not claim the visual-first lesson requirement is complete unless each step can supply its own exact visuals. Clearly list missing assets.

## Active practice screen

Restyle the current timer/check-in experience to the same system:

- cream canvas
- compact white timer card rather than a large unrelated dark panel
- current step image and short instruction remain visible
- success and try-again controls use compact green/pale cards
- help link is always available
- fixed bottom `Complete Lesson` action

A restrained dark timer element is allowed only if it visually harmonises with the reference and does not dominate the screen.

## Help / This isn't working

Open as a compact bottom sheet or pushed screen using:

- current step image or close-up
- common mistake cards
- `Make it easier` recommendation
- one alternative exercise
- safety/stop warning where required
- green `Try again` action

It must preserve the existing troubleshooter logic.

## Feedback

Use compact selectable white rows with pale-green selected state, small rating number/icon, title, and one-line explanation. Keep session summary in a small white card. Avoid an unrelated survey design.

## Completion

Use the same cream canvas and green accents:

- small green check or realistic celebratory dog photo
- short completion heading
- progress gained
- suggested next lesson card with thumbnail
- `Back to Journey` or `Continue` primary button

No cartoon confetti or unrelated dark celebration page.

## Required lesson proof

Capture one complete representative lesson in these states:

- detail
- get ready
- step 1
- step with close-up/correct-avoid visuals
- active practice
- help
- feedback
- completion

Save under `docs/fable-visual-proof/lesson-flow/`.
