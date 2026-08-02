import type { ImageSourcePropType } from 'react-native';

import {
  lessonImageGenerationSpecs,
  type LessonImageSpec,
} from './lessonImageGenerationData';

/**
 * A manifest entry pairs the node-safe generation spec (the single source of
 * truth for prompts and metadata) with the resolved React Native image source
 * used at runtime.
 */
export interface LessonImageManifestEntry extends LessonImageSpec {
  readonly source: ImageSourcePropType;
  /**
   * True only when a verified, lesson-specific image is committed under
   * assets/lesson-images/by-lesson/ and wired into `uniqueLessonImageSources`.
   * Otherwise the entry falls back to the shared skill image (a temporary
   * compatibility fallback until a real per-lesson photograph is approved).
   */
  readonly hasUniqueImage: boolean;
}

/**
 * Shared per-skill fallback images. These are the existing (temporary,
 * non-photorealistic) skill illustrations. They act only as a compatibility
 * fallback until a verified per-lesson photograph exists.
 *
 * React Native requires every asset to be referenced by a static, literal
 * `require()` path so the bundler can resolve it — no dynamic runtime paths.
 */
const sharedSkillFallback = {
  barking: require('../../../../assets/lesson-images/barking.jpg') as ImageSourcePropType,
  chewing: require('../../../../assets/lesson-images/chewing.jpg') as ImageSourcePropType,
  confidence: require('../../../../assets/lesson-images/confidence.jpg') as ImageSourcePropType,
  focus: require('../../../../assets/lesson-images/focus.jpg') as ImageSourcePropType,
  'house-training': require('../../../../assets/lesson-images/house-training.jpg') as ImageSourcePropType,
  'impulse-control': require('../../../../assets/lesson-images/impulse-control.jpg') as ImageSourcePropType,
  jumping: require('../../../../assets/lesson-images/jumping.jpg') as ImageSourcePropType,
  'loose-lead-walking': require('../../../../assets/lesson-images/loose-lead-walking.jpg') as ImageSourcePropType,
  reactivity: require('../../../../assets/lesson-images/reactivity.jpg') as ImageSourcePropType,
  recall: require('../../../../assets/lesson-images/recall.jpg') as ImageSourcePropType,
} as const;

/**
 * Verified, lesson-specific photographs.
 *
 * Each key MUST be an active lesson id and each value MUST be a literal
 * `require()` of a real file under assets/lesson-images/by-lesson/. This map is
 * intentionally empty until real photorealistic images are produced by
 * `scripts/generateLessonImages.ts` and approved. To add one, drop the file in
 * place and add a single literal line here, e.g.:
 *
 *   'recall-name-response':
 *     require('../../../../assets/lesson-images/by-lesson/recall-name-response.jpg'),
 *
 * Do NOT reference a file that does not exist — the React Native bundler
 * resolves these paths statically at build time and will fail otherwise.
 */
const uniqueLessonImageSources: Readonly<Record<string, ImageSourcePropType>> =
  Object.freeze({
    'recall-name-response': require('../../../../assets/lesson-images/by-lesson/recall-name-response.jpg') as ImageSourcePropType,
    'recall-short-distance': require('../../../../assets/lesson-images/by-lesson/recall-short-distance.jpg') as ImageSourcePropType,
    'recall-around-distractions': require('../../../../assets/lesson-images/by-lesson/recall-around-distractions.jpg') as ImageSourcePropType,
    'loose-lead-reward-zone': require('../../../../assets/lesson-images/by-lesson/loose-lead-reward-zone.jpg') as ImageSourcePropType,
    'loose-lead-direction-changes': require('../../../../assets/lesson-images/by-lesson/loose-lead-direction-changes.jpg') as ImageSourcePropType,
    'loose-lead-real-world-distractions': require('../../../../assets/lesson-images/by-lesson/loose-lead-real-world-distractions.jpg') as ImageSourcePropType,
    'focus-check-in': require('../../../../assets/lesson-images/by-lesson/focus-check-in.jpg') as ImageSourcePropType,
    'focus-hold-attention': require('../../../../assets/lesson-images/by-lesson/focus-hold-attention.jpg') as ImageSourcePropType,
    'focus-around-distractions': require('../../../../assets/lesson-images/by-lesson/focus-around-distractions.jpg') as ImageSourcePropType,
    'jumping-four-paws-down': require('../../../../assets/lesson-images/by-lesson/jumping-four-paws-down.jpg') as ImageSourcePropType,
    'jumping-calm-greetings': require('../../../../assets/lesson-images/by-lesson/jumping-calm-greetings.jpg') as ImageSourcePropType,
    'jumping-visitors-and-excitement': require('../../../../assets/lesson-images/by-lesson/jumping-visitors-and-excitement.jpg') as ImageSourcePropType,
    'barking-identify-triggers': require('../../../../assets/lesson-images/by-lesson/barking-identify-triggers.jpg') as ImageSourcePropType,
    'barking-quiet-reinforcement': require('../../../../assets/lesson-images/by-lesson/barking-quiet-reinforcement.jpg') as ImageSourcePropType,
    'barking-real-world-management': require('../../../../assets/lesson-images/by-lesson/barking-real-world-management.jpg') as ImageSourcePropType,
    'chewing-appropriate-items': require('../../../../assets/lesson-images/by-lesson/chewing-appropriate-items.jpg') as ImageSourcePropType,
    'chewing-redirection-routine': require('../../../../assets/lesson-images/by-lesson/chewing-redirection-routine.jpg') as ImageSourcePropType,
    'chewing-independence-and-prevention': require('../../../../assets/lesson-images/by-lesson/chewing-independence-and-prevention.jpg') as ImageSourcePropType,
    'reactivity-safe-distance': require('../../../../assets/lesson-images/by-lesson/reactivity-safe-distance.jpg') as ImageSourcePropType,
    'reactivity-look-and-disengage': require('../../../../assets/lesson-images/by-lesson/reactivity-look-and-disengage.jpg') as ImageSourcePropType,
    'reactivity-controlled-exposure': require('../../../../assets/lesson-images/by-lesson/reactivity-controlled-exposure.jpg') as ImageSourcePropType,
    'house-training-routine': require('../../../../assets/lesson-images/by-lesson/house-training-routine.jpg') as ImageSourcePropType,
    'house-training-signal-and-reward': require('../../../../assets/lesson-images/by-lesson/house-training-signal-and-reward.jpg') as ImageSourcePropType,
    'house-training-reliability': require('../../../../assets/lesson-images/by-lesson/house-training-reliability.jpg') as ImageSourcePropType,
    'confidence-choice-and-exploration': require('../../../../assets/lesson-images/by-lesson/confidence-choice-and-exploration.jpg') as ImageSourcePropType,
    'confidence-new-surfaces-and-sounds': require('../../../../assets/lesson-images/by-lesson/confidence-new-surfaces-and-sounds.jpg') as ImageSourcePropType,
    'confidence-new-environments': require('../../../../assets/lesson-images/by-lesson/confidence-new-environments.jpg') as ImageSourcePropType,
    'impulse-control-wait-for-reward': require('../../../../assets/lesson-images/by-lesson/impulse-control-wait-for-reward.jpg') as ImageSourcePropType,
    'impulse-control-doorways': require('../../../../assets/lesson-images/by-lesson/impulse-control-doorways.jpg') as ImageSourcePropType,
    'impulse-control-real-world-distractions': require('../../../../assets/lesson-images/by-lesson/impulse-control-real-world-distractions.jpg') as ImageSourcePropType,
  });

function fallbackForSkill(skill: string): ImageSourcePropType {
  return (
    sharedSkillFallback[skill as keyof typeof sharedSkillFallback] ??
    sharedSkillFallback.recall
  );
}

export const lessonImageManifest: Readonly<Record<string, LessonImageManifestEntry>> =
  Object.freeze(
    Object.fromEntries(
      lessonImageGenerationSpecs.map((entry) => {
        const unique = uniqueLessonImageSources[entry.lessonId];
        const manifestEntry: LessonImageManifestEntry = Object.freeze({
          ...entry,
          source: unique ?? fallbackForSkill(entry.skill),
          hasUniqueImage: Boolean(unique),
        });
        return [entry.lessonId, manifestEntry];
      }),
    ),
  ) as Readonly<Record<string, LessonImageManifestEntry>>;

export function getLessonImageManifestEntry(
  lessonId: string | null,
): LessonImageManifestEntry | null {
  if (!lessonId) return null;
  return lessonImageManifest[lessonId] ?? null;
}

/**
 * Resolve the image source for a lesson.
 *
 * - A known lesson id returns its lesson-specific image when a verified unique
 *   image exists, otherwise the shared skill fallback for that lesson's skill.
 * - An unknown or missing lesson id falls back to the provided skill (or, as a
 *   last resort, the recall image).
 */
export function getLessonImageSource(
  lessonId: string | null,
  skillFallback?: string | null,
): ImageSourcePropType {
  const entry = lessonId ? lessonImageManifest[lessonId] : undefined;
  if (entry) {
    return entry.source;
  }
  if (skillFallback) {
    return fallbackForSkill(skillFallback);
  }
  return sharedSkillFallback.recall;
}
