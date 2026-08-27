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

All 60 active lessons now have committed, lesson-specific realistic photographs and valid runtime manifest entries. The 30 original photographs remain in place and 30 new realistic photographs are wired to the expanded curriculum. Legacy cartoon/category illustrations are prohibited from runtime and guarded by automated tests.

## Flexible lesson discovery

The personalised **Journey** remains the recommended step-by-step path. It is now deliberately separate from flexible discovery:

- Home shows recommended next lessons, ten training categories, and dog-stage collections.
- Academy provides the same entry points above the searchable full Lesson Library.
- Category pages let owners choose among all six lessons in house training, chewing, barking, jumping, recall, loose-lead walking, focus, impulse control, confidence, or reactivity.
- Curated Puppy, Adult Dog, Senior Dog, and Rescue Dog collections group suitable lessons without changing prerequisite, progress, or safety rules.
- Owners may choose a different active, age-appropriate lesson at any time while Journey continues to represent the recommended progression. Self-directed selection may bypass prerequisite order, but it never bypasses age, inactive-content, ownership, storage-integrity, or Daily Plan safety checks.

## Verification gates

- Catalogue contains exactly 60 unique active lesson IDs and six lessons per skill.
- Original 30 IDs and original three-stage chains remain unchanged.
- Every new support, applied, and maintenance prerequisite path is validated and acyclic.
- Every lesson passes content-depth, measurable-criteria, safety, and force-free audits.
- Image manifest covers all 60 lessons and requires `hasUniqueImage` for every active lesson.
- Full Jest suite, TypeScript check, Expo Doctor, and Android export pass on the owner machine.
