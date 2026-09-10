# Milestone 14 lesson media audit

## Scope

This audit is for the production Good Dog Academy catalogue on `feature/milestone-14-lesson-media-completion`.

## Verified production state

- 60 active production lessons.
- 10 behaviour skills, 6 lessons per skill.
- Every production lesson has a unique committed realistic JPEG under `assets/lesson-images/by-lesson/<lesson-id>.jpg`.
- The lesson image manifest has one active entry per production lesson and no extra lesson IDs.
- The production catalogue currently requires every lesson in this branch to have either 5 or 10 numbered training steps.
- The active lesson session UI can resolve a photo-backed visual for every step.

## Important distinction: lesson photo coverage vs dedicated step media

`lessonStepVisuals.ts` currently has **zero dedicated per-step overrides** in `stepVisualRegistry`.

Therefore:

- every lesson step has photo coverage through that lesson's verified primary realistic photograph;
- no step currently has its own independently verified step-specific setup photograph in the registry;
- no step currently has dedicated `closeUpImages`, `correctImage`, `avoidImage`, annotations, audio, or video entries in the registry unless added later;
- the runtime fallback is intentional and does not claim the lesson-level photograph is a bespoke step photograph.

The remaining binary-media production task is therefore to create/import dedicated step assets and add only genuinely matched assets as overrides. Unknown or ambiguously named images must not be assigned by filename guesswork.

## 60-lesson media map

Each lesson below has a unique primary realistic lesson photograph, but still needs dedicated step-specific media overrides where a distinct step image is desired.

### Recall
- `recall-name-response`
- `recall-short-distance`
- `recall-around-distractions`
- `recall-reward-reset`
- `recall-collar-touch-and-release`
- `recall-real-world-maintenance`

### Loose-lead walking
- `loose-lead-reward-zone`
- `loose-lead-direction-changes`
- `loose-lead-real-world-distractions`
- `loose-lead-stop-and-reset`
- `loose-lead-sniffing-rewards`
- `loose-lead-longer-routes`

### Focus
- `focus-check-in`
- `focus-hold-attention`
- `focus-around-distractions`
- `focus-disengage-and-reset`
- `focus-predictable-patterns`
- `focus-real-world-duration`

### Jumping
- `jumping-four-paws-down`
- `jumping-calm-greetings`
- `jumping-visitors-and-excitement`
- `jumping-station-on-a-mat`
- `jumping-greetings-with-movement`
- `jumping-maintenance-in-public`

### Barking
- `barking-identify-triggers`
- `barking-quiet-reinforcement`
- `barking-real-world-management`
- `barking-meet-needs-first`
- `barking-doorbell-routine`
- `barking-recovery-and-maintenance`

### Chewing
- `chewing-appropriate-items`
- `chewing-redirection-routine`
- `chewing-independence-and-prevention`
- `chewing-puppy-teething-plan`
- `chewing-leave-and-trade`
- `chewing-rotation-and-settle`

### Reactivity
- `reactivity-safe-distance`
- `reactivity-look-and-disengage`
- `reactivity-controlled-exposure`
- `reactivity-emergency-u-turn`
- `reactivity-recovery-after-trigger`
- `reactivity-generalisation-and-maintenance`

### House training
- `house-training-routine`
- `house-training-signal-and-reward`
- `house-training-reliability`
- `house-training-accident-reset`
- `house-training-clear-outdoor-signal`
- `house-training-new-places-and-weather`

### Confidence
- `confidence-choice-and-exploration`
- `confidence-new-surfaces-and-sounds`
- `confidence-new-environments`
- `confidence-consent-based-handling`
- `confidence-recovery-after-surprise`
- `confidence-generalise-brave-choices`

### Impulse control
- `impulse-control-wait-for-reward`
- `impulse-control-doorways`
- `impulse-control-real-world-distractions`
- `impulse-control-leave-it`
- `impulse-control-settle-on-mat`
- `impulse-control-maintenance-and-release`

## Acceptance rules for dedicated step assets

A dedicated asset should only be added to `stepVisualRegistry` when all of the following are true:

1. The image is confidently matched to the exact lesson ID.
2. The image is confidently matched to the exact zero-based step index / human step number.
3. The image visibly depicts that instruction rather than merely the general skill.
4. It uses humane reward-based handling and does not depict aversive equipment.
5. It is a real image file committed to the repository and referenced with a static React Native `require()`.
6. Tests continue to pass and Expo can resolve the asset.

## Current automated protection

The branch includes tests that verify:

- exactly 60 production lessons;
- every production lesson has an allowed 5- or 10-step sequence;
- every current step resolves a non-null photo-backed visual;
- every active lesson has a unique committed JPEG;
- active lesson images are unique by SHA-256 hash;
- legacy cartoon category assets are not used as production lesson fallbacks.

## Remaining work

The code-side fallback and validation are in place. The remaining substantive media work is binary asset production/import and confident lesson+step assignment. This cannot be completed by inventing mappings for unlabelled UUID images.