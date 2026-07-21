# Lesson authoring guide

This guide defines the release rules for immutable Good Dog Academy lesson content. Lesson definitions are bundled application content, not user data, and must be usable without video.

## Required fields

Every `LessonDefinition` must contain:

- `id`: permanent lower-case kebab-case identifier. It is the foreign key used by LessonProgress and future media.
- `contentVersion`: positive integer describing the revision of content under the same competency and ID.
- `title`: short owner-facing lesson name.
- `shortDescription`: plain-language summary of what the lesson teaches.
- `skill`: one recognised BehaviourSkill.
- `category`: `foundation`, `life-skills`, `behaviour`, or `safety`.
- `difficultyLevel`: 1–5, where a higher number means more distance, duration, distraction, complexity, or environmental challenge.
- `estimatedMinutes`: realistic active-session duration.
- `goal`: observable outcome for the lesson.
- `equipment`: complete list of safe materials and management equipment.
- `prerequisites`: stable lesson IDs and required successful-completion counts.
- `minimumDogAgeMonths`: non-negative age where genuinely required, otherwise `null`.
- `steps`: four to eight ordered, numbered, distinct instructions.
- `tips`: at least three practical suggestions.
- `commonMistakes`: at least three realistic errors to avoid.
- `troubleshooting`: at least three problem/solution pairs.
- `safetyNotes`: at least one meaningful risk or welfare note.
- `completionCriteria`: an observable description, required successful-completion count, and optional minimum performance rating.
- `tags`: recognised discovery and context tags.
- `isActive`: whether the lesson may be used for new progress or future planning.

## Stable IDs

- IDs use permanent lower-case kebab case, for example `recall-short-distance`.
- Never rename or reuse a released ID for a different competency.
- Text, tips, safety, troubleshooting, translation, illustration, or video updates retain the existing ID.
- A materially different competency requires a new ID.
- Prerequisites and LessonProgress always reference the stable ID, never a title or array position.

## Difficulty and duration

The initial catalogue maps Foundation to difficulty 1 and approximately 5–8 minutes, Developing to difficulty 2 and 7–12 minutes, and Advanced to difficulty 3 and 10–15 minutes. Levels 4 and 5 remain available for future reviewed progressions.

Higher difficulty must reflect a fair increase in duration, distance, distraction, complexity, generalisation, or environmental challenge. It must never mean harsher handling, corrections, intimidation, or forced exposure.

## Content-version policy

- New production lessons begin at `contentVersion: 1`.
- Increase the integer for minor or moderate updates under the same competency.
- A version change never removes or rewrites LessonProgress.
- Attempts, completions, status, timestamps, ratings, and difficulty adjustment remain intact.
- Previously completed lessons remain completed.
- A materially different competency receives a new stable lesson ID rather than a version increase.

## Prerequisites

- Foundation lessons normally have no lesson prerequisite.
- Developing lessons require the matching Foundation lesson.
- Advanced lessons require the matching Developing lesson.
- Do not create unrelated cross-skill chains without an explicit product and training rationale.
- Every referenced ID must exist in the catalogue.
- Circular and self-referential chains are prohibited and rejected during catalogue loading.

## Inactive lessons

- Retain inactive definitions in the immutable catalogue with the same ID.
- Inactive lessons are excluded from new LessonProgress initialization and future Daily Plans.
- Existing LessonProgress is retained and ownership remains valid.
- An inactive lesson cannot become newly available and cannot be learning or reinforcement eligible.
- If reactivated under the same ID, retained progress resumes unchanged.
- Never delete progress merely because content becomes inactive.

## Completion criteria

Criteria must describe visible, testable behaviour, context, distance or duration, and a realistic success rate. Prefer “The dog returns after one cue in four of five attempts from three metres in a quiet familiar area” over subjective statements such as “The dog understands recall”. Advanced criteria must allow normal variation and must not demand perfection.

## Force-free training rules

Lessons use rewards, toys, praise, play, access to safe environmental rewards, management, distance, brief sessions, choice, gradual desensitisation, and counterconditioning where appropriate.

Never recommend shock or electronic collars, prong collars, choke chains, lead jerks, physical punishment, yelling, intimidation, alpha rolls, dominance-based corrections, flooding, deliberately provoking reactions, withholding essential needs, punishing toileting accidents, or forcing a frightened dog towards a trigger. Safety notes may name an aversive method only to warn owners not to use it.

## Safety requirements

- State relevant equipment, ingestion, traffic, escape, fall, child, person, animal, and environmental risks.
- Recommend secure, correctly fitted equipment where restraint is needed.
- Allow the dog to retreat and stop when the dog cannot eat, respond, disengage, or recover.
- Do not diagnose health or behaviour conditions.
- Recommend veterinary advice for sudden changes, pain, illness, ingestion, or other medical concerns.
- Recommend qualified force-free professional support where behaviour is intense, worsening, unpredictable, or creates injury risk.

### Reactivity-specific requirements

Begin at a safe below-threshold distance. Avoid forced greetings and uncontrolled public encounters. Increase distance immediately when the dog cannot eat, respond, disengage, or recover. Plan barriers and exits, use secure correctly fitted equipment, and never place the owner, dog, helper, public, or another animal at risk. Clearly explain that three app lessons cannot resolve every serious reactivity or aggression case and route significant risk to a qualified force-free trainer or veterinary behaviour professional. Sudden changes may require veterinary investigation for pain or illness.

## Adding a future lesson

1. Confirm that the competency needs a new permanent ID rather than a content-version update.
2. Add the definition to the matching skill module under `src/features/lessons/catalogue/definitions`.
3. Provide every required field and follow the content, safety, and progression rules above.
4. Export it through `definitions/index.ts` so it enters `bundledLessonDefinitions`.
5. Add or update prerequisite references using stable IDs.
6. Run `npm test`, `npx tsc --noEmit`, and `npx expo-doctor`.
7. Confirm the Android Expo export passes before release.

The loader validates definitions during normal application initialization. It rejects malformed content, duplicate IDs, unsupported skills, missing prerequisites, and circular chains. Automated production audits also enforce lesson counts, IDs, versions, content depth, stage progression, durations, and force-free policy.

## Future videos and illustrations

Future media manifests must reference the permanent lesson ID plus their own media version or locale. Media changes do not rename the lesson, change its competency, or reset LessonProgress. Do not couple media to a title, list index, or mutable display order.

## Final author checklist

- [ ] Permanent kebab-case ID confirmed and not previously used.
- [ ] Content version is correct for the existing competency.
- [ ] Skill, category, difficulty, duration, tags, and age rule validate.
- [ ] Prerequisites exist, are necessary, and introduce no cycle.
- [ ] Four to eight numbered steps are distinct and usable without video.
- [ ] At least three tips, mistakes, and troubleshooting pairs are substantive.
- [ ] Completion criteria are observable, measurable, and realistic.
- [ ] Language is friendly, non-judgmental, and uses Australian/British spelling.
- [ ] Methods are reward-based, force-free, choice-aware, and humane.
- [ ] Safety notes address the actual risks and appropriate professional support.
- [ ] Inactive and content-version effects on existing progress have been reviewed.
- [ ] Catalogue, policy, TypeScript, Expo Doctor, and Android export checks pass.
