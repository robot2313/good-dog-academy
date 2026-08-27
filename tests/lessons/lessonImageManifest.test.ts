import { existsSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

import { productionLessonDefinitions } from '../../src/features/lessons/catalogue/definitions';
import { lessonImageGenerationSpecs } from '../../src/features/lessons/coaching/lessonImageGenerationData';
import {
  getLessonImageManifestEntry,
  getLessonImageSource,
  lessonImageManifest,
} from '../../src/features/lessons/coaching/lessonImageManifest';

const activeLessonIds = productionLessonDefinitions.map((lesson) => lesson.id);
const approvedUniqueLessonIds = new Set(activeLessonIds);

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

  it('serves an approved unique realistic photograph for every active lesson', () => {
    for (const id of activeLessonIds) {
      const entry = lessonImageManifest[id];
      expect(getLessonImageSource(id, entry.skill)).toBe(entry.source);

      expect(approvedUniqueLessonIds.has(id)).toBe(true);
      expect(entry.hasUniqueImage).toBe(true);
      expect(entry.source).toBeDefined();
    }
  });

  it('ships a non-trivial unique committed JPEG for every active lesson', () => {
    const root = resolve(__dirname, '../..');
    const hashes = new Set<string>();
    for (const id of activeLessonIds) {
      const imagePath = resolve(root, 'assets', 'lesson-images', 'by-lesson', `${id}.jpg`);
      expect(existsSync(imagePath)).toBe(true);
      expect(statSync(imagePath).size).toBeGreaterThan(60_000);
      hashes.add(createHash('sha256').update(readFileSync(imagePath)).digest('hex'));
    }
    expect(hashes.size).toBe(activeLessonIds.length);
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
