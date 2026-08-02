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
  Object.freeze({});

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
