import type { ImageSourcePropType } from 'react-native';

import type { LessonId } from '../../../domain/models';

/**
 * Visual-first lesson instruction model (Fable 5 lesson experience contract).
 *
 * Every practical step can attach its own exact visuals instead of relying on
 * one generic lesson thumbnail: a full-body setup photograph, close-ups of the
 * exact hand / lead / body placement, a correct-versus-avoid comparison,
 * overlay annotations, and optional demonstration video or spoken instruction.
 *
 * The registry below ships empty on purpose. The production photo library
 * currently contains one approved realistic photograph per lesson (61 assets);
 * per-step close-up, correct/avoid, and demonstration assets have not been
 * produced yet. Screens must treat every field as optional and fall back to the
 * lesson's primary photograph, and the missing assets are listed candidly in
 * docs/fable-visual-proof/COMPARISON.md rather than papered over here.
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

/** Per-lesson, per-step (zero-based) visual assets. */
const stepVisualRegistry: Partial<Record<LessonId, Readonly<Record<number, LessonStepVisual>>>> = {};

export function getLessonStepVisual(lessonId: LessonId, stepIndex: number): LessonStepVisual | null {
  return stepVisualRegistry[lessonId]?.[stepIndex] ?? null;
}

export function lessonHasStepVisuals(lessonId: LessonId): boolean {
  const entry = stepVisualRegistry[lessonId];
  return entry !== undefined && Object.keys(entry).length > 0;
}
