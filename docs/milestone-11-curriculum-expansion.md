# Milestone 11 — Curriculum Expansion

## Objective

Expand Good Dog Academy from 30 to 60 active lessons before release without changing or reusing any existing permanent lesson ID.

## Curriculum structure

Each of the ten behaviour skills now contains six lessons:

1. Foundation lesson — existing difficulty 1 lesson.
2. Developing lesson — existing difficulty 2 lesson.
3. Support lesson — new difficulty 2 lesson that repairs common sticking points or strengthens the foundation.
4. Advanced lesson — existing difficulty 3 real-world lesson.
5. Applied-practice lesson — new difficulty 3 lesson combining the developing and support work.
6. Maintenance lesson — new difficulty 4 lesson for generalisation, realistic duration, and long-term reliability.

The new prerequisite shape is intentionally layered:

- Support requires Foundation.
- Applied practice requires Developing and Support.
- Maintenance requires Advanced and Applied practice.

## Added lesson themes

- Recall: reward reset, collar-touch arrival, and real-world maintenance.
- Loose-lead walking: calm pulling resets, sniffing as reinforcement, and longer routes.
- Focus: disengagement resets, predictable patterns, and real-world duration.
- Jumping: mat stations, greetings with movement, and public maintenance.
- Barking: meeting needs first, doorbell routines, and recovery tracking.
- Chewing: puppy teething plans, cooperative trades, and settle routines.
- Reactivity: emergency U-turns, post-trigger recovery, and safe generalisation.
- House training: accident resets, clear toilet signals, and new places or weather.
- Confidence: consent-based handling, surprise recovery, and generalised brave choices.
- Impulse control: leave-it choices, mat settling, and reliable release cues.

## Safety and welfare rules

All content remains reward-based, force-free, non-diagnostic, and usable without video. Lessons use management, distance, choice, reinforcement, short sessions, and realistic completion criteria. Reactivity, guarding, sudden behaviour changes, suspected pain, ingestion, and injury-risk scenarios route owners to veterinary or qualified force-free professional support.

## Media status

The existing 30 lessons retain approved unique photographs. Every new lesson has a complete photorealistic generation specification and a valid runtime manifest entry, but currently uses its skill-level fallback image. Unique images must be generated, reviewed, committed, and wired into `uniqueLessonImageSources` before final media sign-off.

## Verification gates

- Catalogue contains exactly 60 unique active lesson IDs and six lessons per skill.
- Original 30 IDs and original three-stage chains remain unchanged.
- Every new support, applied, and maintenance prerequisite path is validated and acyclic.
- Every lesson passes content-depth, measurable-criteria, safety, and force-free audits.
- Image manifest covers all 60 lessons and distinguishes approved images from temporary fallbacks.
- Full Jest suite, TypeScript check, Expo Doctor, and Android export pass on the owner machine.
