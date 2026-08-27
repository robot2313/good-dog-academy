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
   * Every active production lesson now has a committed, lesson-specific realistic photograph.
   */
  readonly hasUniqueImage: boolean;
}

/**
 * Approved photorealistic per-skill fallbacks.
 *
 * VISUAL POLICY LOCK: runtime lesson imagery must always be a real photograph.
 * The legacy category illustrations under `assets/lesson-images/<skill>.jpg`
 * are intentionally forbidden here. Every active lesson must also have a committed unique photograph; the fallback exists only as a defensive guard for unknown IDs.
 *
 * React Native requires every asset to be referenced by a static, literal
 * `require()` path so the bundler can resolve it — no dynamic runtime paths.
 */
const realisticSkillFallback = {
  barking: require('../../../../assets/lesson-images/by-lesson/barking-identify-triggers.jpg') as ImageSourcePropType,
  chewing: require('../../../../assets/lesson-images/by-lesson/chewing-appropriate-items.jpg') as ImageSourcePropType,
  confidence: require('../../../../assets/lesson-images/by-lesson/confidence-choice-and-exploration.jpg') as ImageSourcePropType,
  focus: require('../../../../assets/lesson-images/by-lesson/focus-check-in.jpg') as ImageSourcePropType,
  'house-training': require('../../../../assets/lesson-images/by-lesson/house-training-routine.jpg') as ImageSourcePropType,
  'impulse-control': require('../../../../assets/lesson-images/by-lesson/impulse-control-wait-for-reward.jpg') as ImageSourcePropType,
  jumping: require('../../../../assets/lesson-images/by-lesson/jumping-four-paws-down.jpg') as ImageSourcePropType,
  'loose-lead-walking': require('../../../../assets/lesson-images/by-lesson/loose-lead-reward-zone.jpg') as ImageSourcePropType,
  reactivity: require('../../../../assets/lesson-images/by-lesson/reactivity-safe-distance.jpg') as ImageSourcePropType,
  recall: require('../../../../assets/lesson-images/by-lesson/recall-name-response.jpg') as ImageSourcePropType,
} as const;

/**
 * Verified, lesson-specific photographs.
 *
 * Each key MUST be an active lesson id and each value MUST be a literal
 * `require()` of a real file under assets/lesson-images/by-lesson/. This map is
 * expanded only after realistic images are produced by
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
    'recall-reward-reset': require('../../../../assets/lesson-images/by-lesson/recall-reward-reset.jpg') as ImageSourcePropType,
    'recall-collar-touch-and-release': require('../../../../assets/lesson-images/by-lesson/recall-collar-touch-and-release.jpg') as ImageSourcePropType,
    'recall-real-world-maintenance': require('../../../../assets/lesson-images/by-lesson/recall-real-world-maintenance.jpg') as ImageSourcePropType,
    'loose-lead-stop-and-reset': require('../../../../assets/lesson-images/by-lesson/loose-lead-stop-and-reset.jpg') as ImageSourcePropType,
    'loose-lead-sniffing-rewards': require('../../../../assets/lesson-images/by-lesson/loose-lead-sniffing-rewards.jpg') as ImageSourcePropType,
    'loose-lead-longer-routes': require('../../../../assets/lesson-images/by-lesson/loose-lead-longer-routes.jpg') as ImageSourcePropType,
    'focus-disengage-and-reset': require('../../../../assets/lesson-images/by-lesson/focus-disengage-and-reset.jpg') as ImageSourcePropType,
    'focus-predictable-patterns': require('../../../../assets/lesson-images/by-lesson/focus-predictable-patterns.jpg') as ImageSourcePropType,
    'focus-real-world-duration': require('../../../../assets/lesson-images/by-lesson/focus-real-world-duration.jpg') as ImageSourcePropType,
    'jumping-station-on-a-mat': require('../../../../assets/lesson-images/by-lesson/jumping-station-on-a-mat.jpg') as ImageSourcePropType,
    'jumping-greetings-with-movement': require('../../../../assets/lesson-images/by-lesson/jumping-greetings-with-movement.jpg') as ImageSourcePropType,
    'jumping-maintenance-in-public': require('../../../../assets/lesson-images/by-lesson/jumping-maintenance-in-public.jpg') as ImageSourcePropType,
    'barking-meet-needs-first': require('../../../../assets/lesson-images/by-lesson/barking-meet-needs-first.jpg') as ImageSourcePropType,
    'barking-doorbell-routine': require('../../../../assets/lesson-images/by-lesson/barking-doorbell-routine.jpg') as ImageSourcePropType,
    'barking-recovery-and-maintenance': require('../../../../assets/lesson-images/by-lesson/barking-recovery-and-maintenance.jpg') as ImageSourcePropType,
    'chewing-puppy-teething-plan': require('../../../../assets/lesson-images/by-lesson/chewing-puppy-teething-plan.jpg') as ImageSourcePropType,
    'chewing-leave-and-trade': require('../../../../assets/lesson-images/by-lesson/chewing-leave-and-trade.jpg') as ImageSourcePropType,
    'chewing-rotation-and-settle': require('../../../../assets/lesson-images/by-lesson/chewing-rotation-and-settle.jpg') as ImageSourcePropType,
    'reactivity-emergency-u-turn': require('../../../../assets/lesson-images/by-lesson/reactivity-emergency-u-turn.jpg') as ImageSourcePropType,
    'reactivity-recovery-after-trigger': require('../../../../assets/lesson-images/by-lesson/reactivity-recovery-after-trigger.jpg') as ImageSourcePropType,
    'reactivity-generalisation-and-maintenance': require('../../../../assets/lesson-images/by-lesson/reactivity-generalisation-and-maintenance.jpg') as ImageSourcePropType,
    'house-training-accident-reset': require('../../../../assets/lesson-images/by-lesson/house-training-accident-reset.jpg') as ImageSourcePropType,
    'house-training-clear-outdoor-signal': require('../../../../assets/lesson-images/by-lesson/house-training-clear-outdoor-signal.jpg') as ImageSourcePropType,
    'house-training-new-places-and-weather': require('../../../../assets/lesson-images/by-lesson/house-training-new-places-and-weather.jpg') as ImageSourcePropType,
    'confidence-consent-based-handling': require('../../../../assets/lesson-images/by-lesson/confidence-consent-based-handling.jpg') as ImageSourcePropType,
    'confidence-recovery-after-surprise': require('../../../../assets/lesson-images/by-lesson/confidence-recovery-after-surprise.jpg') as ImageSourcePropType,
    'confidence-generalise-brave-choices': require('../../../../assets/lesson-images/by-lesson/confidence-generalise-brave-choices.jpg') as ImageSourcePropType,
    'impulse-control-leave-it': require('../../../../assets/lesson-images/by-lesson/impulse-control-leave-it.jpg') as ImageSourcePropType,
    'impulse-control-settle-on-mat': require('../../../../assets/lesson-images/by-lesson/impulse-control-settle-on-mat.jpg') as ImageSourcePropType,
    'impulse-control-maintenance-and-release': require('../../../../assets/lesson-images/by-lesson/impulse-control-maintenance-and-release.jpg') as ImageSourcePropType,
  });

function fallbackForSkill(skill: string): ImageSourcePropType {
  return (
    realisticSkillFallback[skill as keyof typeof realisticSkillFallback] ??
    realisticSkillFallback.recall
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
 *   image exists, otherwise an approved photorealistic fallback from that lesson's skill.
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
  return realisticSkillFallback.recall;
}
