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

  it('uses the shared skill fallback only for an unknown or missing lesson id', () => {
    // An unknown id returns a stable shared fallback for the requested skill...
    const unknownConfidence = getLessonImageSource('not-a-real-lesson', 'confidence');
    expect(unknownConfidence).toBe(getLessonImageSource('also-not-real', 'confidence'));
    expect(unknownConfidence).toBe(getLessonImageSource(null, 'confidence'));
    // ...which is NOT any real lesson's unique photograph.
    expect(unknownConfidence).not.toBe(
      lessonImageManifest['confidence-choice-and-exploration'].source,
    );
    // A missing id with no skill hint falls back to a stable last-resort image.
    expect(getLessonImageSource(null)).toBe(getLessonImageSource('unknown', null));
  });

  it('serves approved unique photographs and safe skill fallbacks for lessons awaiting images', () => {
    for (const id of activeLessonIds) {
      const entry = lessonImageManifest[id];
      const skillFallback = getLessonImageSource('unknown-lesson', entry.skill);

      expect(getLessonImageSource(id, entry.skill)).toBe(entry.source);

      if (approvedUniqueLessonIds.has(id)) {
        expect(entry.hasUniqueImage).toBe(true);
        expect(entry.source).not.toBe(skillFallback);
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
