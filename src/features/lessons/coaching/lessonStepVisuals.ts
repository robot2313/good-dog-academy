import type { ImageSourcePropType } from 'react-native';

import type { LessonId } from '../../../domain/models';
import { getLessonImageManifestEntry } from './lessonImageManifest';

/**
 * Visual-first lesson instruction model (Fable 5 lesson experience contract).
 *
 * Every practical step can attach its own exact visuals instead of relying on
 * one generic lesson thumbnail: a full-body setup photograph, close-ups of the
 * exact hand / lead / body placement, a correct-versus-avoid comparison,
 * overlay annotations, and optional demonstration video or spoken instruction.
 *
 * The registry remains available for true step-specific media overrides. When
 * a step does not yet have a dedicated override, the runtime now uses that
 * lesson's verified, lesson-specific photograph as the step image. This keeps
 * all 60 lessons photo-led at every step without falling back to cartoons or a
 * different lesson's image, while allowing exact close-up/correct/avoid media
 * to be added incrementally without changing the screen contract.
 */
export type StepOverlayAnnotation = {
  /** Short instruction rendered as a labelled callout over the image. */
  readonly label: string;
  /** Position of the callout anchor, as fractions of the image (0–1). */
  readonly x: number;
  readonly y: number;
};

export type LessonStepVisual = {
  /** Full-body setup photograph showing owner and dog position. */
  readonly setupImage?: ImageSourcePropType;
  /** Close-ups: exact reward hand, height, lead, harness, foot or body placement. */
  readonly closeUpImages?: readonly ImageSourcePropType[];
  /** The correct execution of this step. */
  readonly correctImage?: ImageSourcePropType;
  /** The common mistake to avoid, paired with correctImage. */
  readonly avoidImage?: ImageSourcePropType;
  /** Labelled callouts drawn over the setup image. */
  readonly overlayAnnotations?: readonly StepOverlayAnnotation[];
  /** Short demonstration loop where a still cannot show the movement. */
  readonly demonstrationVideo?: ImageSourcePropType;
  /** Optional spoken instruction asset. */
  readonly spokenInstruction?: ImageSourcePropType;
  /** One-line caption shown under the visuals. */
  readonly caption?: string;
};

/**
 * Per-lesson, per-step (zero-based) exact-media overrides.
 *
 * Add entries here only when a dedicated step asset genuinely depicts that
 * exact instruction. Generic visual coverage is supplied by
 * `fallbackStepVisual` from the verified per-lesson photo manifest.
 */
const stepVisualRegistry: Partial<Record<LessonId, Readonly<Record<number, LessonStepVisual>>>> = {};

function fallbackStepVisual(lessonId: LessonId, stepIndex: number): LessonStepVisual | null {
  const lessonImage = getLessonImageManifestEntry(lessonId);
  if (!lessonImage) return null;

  return {
    setupImage: lessonImage.source,
    caption: `${lessonImage.title} — step ${stepIndex + 1}`,
  };
}

export function getLessonStepVisual(lessonId: LessonId, stepIndex: number): LessonStepVisual | null {
  return stepVisualRegistry[lessonId]?.[stepIndex] ?? fallbackStepVisual(lessonId, stepIndex);
}

export function lessonHasStepVisuals(lessonId: LessonId): boolean {
  const exactEntry = stepVisualRegistry[lessonId];
  if (exactEntry !== undefined && Object.keys(exactEntry).length > 0) return true;
  return getLessonImageManifestEntry(lessonId) !== null;
}
