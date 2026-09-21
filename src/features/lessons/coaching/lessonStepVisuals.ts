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
const stepVisualRegistry: Partial<Record<LessonId, Readonly<Record<number, LessonStepVisual>>>> = {
  'loose-lead-reward-zone': {
    0: {
      setupImage: require('../../../../assets/lesson-step-images/loose-lead-reward-zone/step-1.jpg'),
      caption: 'Step 1 of 5',
    },    1: {
      setupImage: require('../../../../assets/lesson-step-images/loose-lead-reward-zone/step-2.jpg'),
      caption: 'Step 2 of 5',
    },    2: {
      setupImage: require('../../../../assets/lesson-step-images/loose-lead-reward-zone/step-3.jpg'),
      caption: 'Step 3 of 5',
    },    3: {
      setupImage: require('../../../../assets/lesson-step-images/loose-lead-reward-zone/step-4.jpg'),
      caption: 'Step 4 of 5',
    },    4: {
      setupImage: require('../../../../assets/lesson-step-images/loose-lead-reward-zone/step-5.jpg'),
      caption: 'Step 5 of 5',
    }
  },
  'recall-name-response': {
    0: {
      setupImage: require('../../../../assets/lesson-step-images/recall-name-response/step-1.jpg'),
      caption: 'Step 1 of 5',
    },    1: {
      setupImage: require('../../../../assets/lesson-step-images/recall-name-response/step-2.jpg'),
      caption: 'Step 2 of 5',
    },    2: {
      setupImage: require('../../../../assets/lesson-step-images/recall-name-response/step-3.jpg'),
      caption: 'Step 3 of 5',
    },    3: {
      setupImage: require('../../../../assets/lesson-step-images/recall-name-response/step-4.jpg'),
      caption: 'Step 4 of 5',
    },    4: {
      setupImage: require('../../../../assets/lesson-step-images/recall-name-response/step-5.jpg'),
      caption: 'Step 5 of 5',
    }
  },
  'chewing-redirection-routine': {
    0: {
      setupImage: require('../../../../assets/lesson-step-images/chewing-redirection-routine/step-1.jpg'),
      caption: 'Step 1 of 5',
    },    1: {
      setupImage: require('../../../../assets/lesson-step-images/chewing-redirection-routine/step-2.jpg'),
      caption: 'Step 2 of 5',
    },    2: {
      setupImage: require('../../../../assets/lesson-step-images/chewing-redirection-routine/step-3.jpg'),
      caption: 'Step 3 of 5',
    },    3: {
      setupImage: require('../../../../assets/lesson-step-images/chewing-redirection-routine/step-4.jpg'),
      caption: 'Step 4 of 5',
    },    4: {
      setupImage: require('../../../../assets/lesson-step-images/chewing-redirection-routine/step-5.jpg'),
      caption: 'Step 5 of 5',
    }
  },
  'chewing-puppy-teething-plan': {
    0: {
      setupImage: require('../../../../assets/lesson-step-images/chewing-puppy-teething-plan/step-1.jpg'),
      caption: 'Step 1 of 5',
    },    1: {
      setupImage: require('../../../../assets/lesson-step-images/chewing-puppy-teething-plan/step-2.jpg'),
      caption: 'Step 2 of 5',
    },    2: {
      setupImage: require('../../../../assets/lesson-step-images/chewing-puppy-teething-plan/step-3.jpg'),
      caption: 'Step 3 of 5',
    },    3: {
      setupImage: require('../../../../assets/lesson-step-images/chewing-puppy-teething-plan/step-4.jpg'),
      caption: 'Step 4 of 5',
    },    4: {
      setupImage: require('../../../../assets/lesson-step-images/chewing-puppy-teething-plan/step-5.jpg'),
      caption: 'Step 5 of 5',
    }
  },
  'confidence-choice-and-exploration': {
    0: {
      setupImage: require('../../../../assets/lesson-step-images/confidence-choice-and-exploration/step-1.jpg'),
      caption: 'Step 1 of 5',
    },    1: {
      setupImage: require('../../../../assets/lesson-step-images/confidence-choice-and-exploration/step-2.jpg'),
      caption: 'Step 2 of 5',
    },    2: {
      setupImage: require('../../../../assets/lesson-step-images/confidence-choice-and-exploration/step-3.jpg'),
      caption: 'Step 3 of 5',
    },    3: {
      setupImage: require('../../../../assets/lesson-step-images/confidence-choice-and-exploration/step-4.jpg'),
      caption: 'Step 4 of 5',
    },    4: {
      setupImage: require('../../../../assets/lesson-step-images/confidence-choice-and-exploration/step-5.jpg'),
      caption: 'Step 5 of 5',
    }
  },
  'confidence-new-surfaces-and-sounds': {
    0: {
      setupImage: require('../../../../assets/lesson-step-images/confidence-new-surfaces-and-sounds/step-1.jpg'),
      caption: 'Step 1 of 5',
    },    1: {
      setupImage: require('../../../../assets/lesson-step-images/confidence-new-surfaces-and-sounds/step-2.jpg'),
      caption: 'Step 2 of 5',
    },    2: {
      setupImage: require('../../../../assets/lesson-step-images/confidence-new-surfaces-and-sounds/step-3.jpg'),
      caption: 'Step 3 of 5',
    },    3: {
      setupImage: require('../../../../assets/lesson-step-images/confidence-new-surfaces-and-sounds/step-4.jpg'),
      caption: 'Step 4 of 5',
    },    4: {
      setupImage: require('../../../../assets/lesson-step-images/confidence-new-surfaces-and-sounds/step-5.jpg'),
      caption: 'Step 5 of 5',
    }
  },
  'impulse-control-doorways': {
    0: {
      setupImage: require('../../../../assets/lesson-step-images/impulse-control-doorways/step-1.jpg'),
      caption: 'Step 1 of 5',
    },    1: {
      setupImage: require('../../../../assets/lesson-step-images/impulse-control-doorways/step-2.jpg'),
      caption: 'Step 2 of 5',
    },    2: {
      setupImage: require('../../../../assets/lesson-step-images/impulse-control-doorways/step-3.jpg'),
      caption: 'Step 3 of 5',
    },    3: {
      setupImage: require('../../../../assets/lesson-step-images/impulse-control-doorways/step-4.jpg'),
      caption: 'Step 4 of 5',
    },    4: {
      setupImage: require('../../../../assets/lesson-step-images/impulse-control-doorways/step-5.jpg'),
      caption: 'Step 5 of 5',
    }
  },
  'jumping-calm-greetings': {
    0: {
      setupImage: require('../../../../assets/lesson-step-images/jumping-calm-greetings/step-1.jpg'),
      caption: 'Step 1 of 5',
    },    1: {
      setupImage: require('../../../../assets/lesson-step-images/jumping-calm-greetings/step-2.jpg'),
      caption: 'Step 2 of 5',
    },    2: {
      setupImage: require('../../../../assets/lesson-step-images/jumping-calm-greetings/step-3.jpg'),
      caption: 'Step 3 of 5',
    },    3: {
      setupImage: require('../../../../assets/lesson-step-images/jumping-calm-greetings/step-4.jpg'),
      caption: 'Step 4 of 5',
    },    4: {
      setupImage: require('../../../../assets/lesson-step-images/jumping-calm-greetings/step-5.jpg'),
      caption: 'Step 5 of 5',
    }
  },
  'impulse-control-settle-on-mat': {
    0: {
      setupImage: require('../../../../assets/lesson-step-images/impulse-control-settle-on-mat/step-1.jpg'),
      caption: 'Step 1 of 5',
    },    1: {
      setupImage: require('../../../../assets/lesson-step-images/impulse-control-settle-on-mat/step-2.jpg'),
      caption: 'Step 2 of 5',
    },    2: {
      setupImage: require('../../../../assets/lesson-step-images/impulse-control-settle-on-mat/step-3.jpg'),
      caption: 'Step 3 of 5',
    },    3: {
      setupImage: require('../../../../assets/lesson-step-images/impulse-control-settle-on-mat/step-4.jpg'),
      caption: 'Step 4 of 5',
    },    4: {
      setupImage: require('../../../../assets/lesson-step-images/impulse-control-settle-on-mat/step-5.jpg'),
      caption: 'Step 5 of 5',
    }
  },
  'focus-hold-attention': {
    0: {
      setupImage: require('../../../../assets/lesson-step-images/focus-hold-attention/step-1.jpg'),
      caption: 'Step 1 of 5',
    },    1: {
      setupImage: require('../../../../assets/lesson-step-images/focus-hold-attention/step-2.jpg'),
      caption: 'Step 2 of 5',
    },    2: {
      setupImage: require('../../../../assets/lesson-step-images/focus-hold-attention/step-3.jpg'),
      caption: 'Step 3 of 5',
    },    3: {
      setupImage: require('../../../../assets/lesson-step-images/focus-hold-attention/step-4.jpg'),
      caption: 'Step 4 of 5',
    },    4: {
      setupImage: require('../../../../assets/lesson-step-images/focus-hold-attention/step-5.jpg'),
      caption: 'Step 5 of 5',
    }
  }
};

export function getLessonStepVisual(lessonId: LessonId, stepIndex: number): LessonStepVisual | null {
  return stepVisualRegistry[lessonId]?.[stepIndex] ?? null;
}

export function lessonHasStepVisuals(lessonId: LessonId): boolean {
  const entry = stepVisualRegistry[lessonId];
  return entry !== undefined && Object.keys(entry).length > 0;
}
