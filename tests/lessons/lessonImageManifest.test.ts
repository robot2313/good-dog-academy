import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { productionLessonDefinitions } from '../../src/features/lessons/catalogue/definitions';
import { lessonImageGenerationSpecs } from '../../src/features/lessons/coaching/lessonImageGenerationData';
import {
  getLessonImageManifestEntry,
  getLessonImageSource,
  lessonImageManifest,
} from '../../src/features/lessons/coaching/lessonImageManifest';

const activeLessonIds = productionLessonDefinitions.map((lesson) => lesson.id);
const approvedUniqueLessonIds = new Set([
  'recall-name-response',
  'recall-short-distance',
  'recall-around-distractions',
  'loose-lead-reward-zone',
  'loose-lead-direction-changes',
  'loose-lead-real-world-distractions',
  'focus-check-in',
  'focus-hold-attention',
  'focus-around-distractions',
  'jumping-four-paws-down',
  'jumping-calm-greetings',
  'jumping-visitors-and-excitement',
  'barking-identify-triggers',
  'barking-quiet-reinforcement',
  'barking-real-world-management',
  'chewing-appropriate-items',
  'chewing-redirection-routine',
  'chewing-independence-and-prevention',
  'reactivity-safe-distance',
  'reactivity-look-and-disengage',
  'reactivity-controlled-exposure',
  'house-training-routine',
  'house-training-signal-and-reward',
  'house-training-reliability',
  'confidence-choice-and-exploration',
  'confidence-new-surfaces-and-sounds',
  'confidence-new-environments',
  'impulse-control-wait-for-reward',
  'impulse-control-doorways',
  'impulse-control-real-world-distractions',
]);

const approvedRealisticFallbacks = {
  barking: require('../../assets/lesson-images/by-lesson/barking-identify-triggers.jpg'),
  chewing: require('../../assets/lesson-images/by-lesson/chewing-appropriate-items.jpg'),
  confidence: require('../../assets/lesson-images/by-lesson/confidence-choice-and-exploration.jpg'),
  focus: require('../../assets/lesson-images/by-lesson/focus-check-in.jpg'),
  'house-training': require('../../assets/lesson-images/by-lesson/house-training-routine.jpg'),
  'impulse-control': require('../../assets/lesson-images/by-lesson/impulse-control-wait-for-reward.jpg'),
  jumping: require('../../assets/lesson-images/by-lesson/jumping-four-paws-down.jpg'),
  'loose-lead-walking': require('../../assets/lesson-images/by-lesson/loose-lead-reward-zone.jpg'),
  reactivity: require('../../assets/lesson-images/by-lesson/reactivity-safe-distance.jpg'),
  recall: require('../../assets/lesson-images/by-lesson/recall-name-response.jpg'),
} as const;


describe('lesson image manifest', () => {
  it('covers every active lesson id with no omissions', () => {
    for (const id of activeLessonIds) {
      expect(lessonImageManifest[id]).toBeDefined();
    }
    expect(Object.keys(lessonImageManifest).sort()).toEqual([...activeLessonIds].sort());
  });

  it('contains no invented or invalid lesson ids', () => {
    const active = new Set(activeLessonIds);
    for (const key of Object.keys(lessonImageManifest)) {
      expect(active.has(key)).toBe(true);
    }
    for (const spec of lessonImageGenerationSpecs) {
      expect(active.has(spec.lessonId)).toBe(true);
    }
  });

  it('returns a lesson-specific manifest entry and image for a known lesson id', () => {
    const id = 'recall-name-response';
    const entry = getLessonImageManifestEntry(id);
    expect(entry).not.toBeNull();
    expect(entry?.title).toBe('Name Response');
    expect(entry?.skill).toBe('recall');
    expect(getLessonImageSource(id, 'recall')).toBe(lessonImageManifest[id].source);
  });

  it('uses approved realistic photographs for every skill fallback and never a legacy cartoon', () => {
    for (const skill of Object.keys(approvedRealisticFallbacks) as Array<
      keyof typeof approvedRealisticFallbacks
    >) {
      const fallback = getLessonImageSource('not-a-real-lesson', skill);
      expect(fallback).toBe(approvedRealisticFallbacks[skill]);
      expect(getLessonImageSource(null, skill)).toBe(fallback);
    }

    // A missing id with no skill hint falls back to the approved recall photograph.
    expect(getLessonImageSource(null)).toBe(approvedRealisticFallbacks.recall);
    expect(getLessonImageSource('unknown', null)).toBe(approvedRealisticFallbacks.recall);
  });

  it('keeps legacy cartoon category assets out of the repository', () => {
    const root = resolve(__dirname, '../..');
    const legacyFilenames = [
      'barking.jpg',
      'chewing.jpg',
      'confidence.jpg',
      'focus.jpg',
      'house-training.jpg',
      'impulse-control.jpg',
      'jumping.jpg',
      'loose-lead-walking.jpg',
      'reactivity.jpg',
      'recall.jpg',
    ];

    for (const filename of legacyFilenames) {
      expect(existsSync(resolve(root, 'assets/lesson-images', filename))).toBe(false);
    }
  });

  it('serves approved unique photographs and approved realistic fallbacks for lessons awaiting images', () => {
    for (const id of activeLessonIds) {
      const entry = lessonImageManifest[id];
      const skillFallback = getLessonImageSource('unknown-lesson', entry.skill);

      expect(getLessonImageSource(id, entry.skill)).toBe(entry.source);

      if (approvedUniqueLessonIds.has(id)) {
        expect(entry.hasUniqueImage).toBe(true);
      } else {
        expect(entry.hasUniqueImage).toBe(false);
        expect(entry.source).toBe(skillFallback);
      }
    }
  });

  it('gives every spec a photorealistic prompt, humane negative prompt and id-based filename', () => {
    for (const spec of lessonImageGenerationSpecs) {
      expect(spec.prompt.toLowerCase()).toContain('photorealistic');
      expect(spec.negativePrompt).toContain('cartoon');
      expect(spec.negativePrompt).toContain('prong collar');
      expect(spec.destinationFilename).toBe(`${spec.lessonId}.jpg`);
    }
  });
});
