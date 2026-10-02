import { productionLessonDefinitions } from '../../../src/features/lessons/catalogue/definitions';
import {
  getCameraCoachQaLessons,
  getCameraCoachQaLesson,
  isCameraCoachQaLessonId,
} from '../../../src/domain/camera/CameraCoachQaLessons';
import {
  expectedCueResponseForLesson,
  supportsAutomaticPostureScoring,
} from '../../../src/domain/camera/ExpectedCueResponse';

describe('Camera Coach QA lesson isolation', () => {
  it('keeps every QA lesson outside the production curriculum', () => {
    const productionIds = new Set(
      productionLessonDefinitions.map((lesson) => lesson.id),
    );

    for (const qaLesson of getCameraCoachQaLessons()) {
      expect(productionIds.has(qaLesson.id)).toBe(false);
    }
  });

  it('recognises only the declared QA lesson IDs', () => {
    for (const qaLesson of getCameraCoachQaLessons()) {
      expect(isCameraCoachQaLessonId(qaLesson.id)).toBe(true);
      expect(getCameraCoachQaLesson(qaLesson.id)).toEqual(qaLesson);
    }

    expect(isCameraCoachQaLessonId('sit')).toBe(false);
    expect(isCameraCoachQaLessonId('four-paws')).toBe(false);
  });

  it('enables automatic posture scoring only for controlled posture QA lessons', () => {
    expect(expectedCueResponseForLesson('qa-camera-sit')?.expectedPosture).toBe('sit_like');
    expect(expectedCueResponseForLesson('qa-camera-stand')?.expectedPosture).toBe('stand_like');
    expect(expectedCueResponseForLesson('qa-camera-down')?.expectedPosture).toBe('down_like');

    expect(supportsAutomaticPostureScoring('qa-camera-sit')).toBe(true);
    expect(supportsAutomaticPostureScoring('qa-camera-stand')).toBe(true);
    expect(supportsAutomaticPostureScoring('qa-camera-down')).toBe(true);

    expect(expectedCueResponseForLesson('qa-camera-four-paws')).toBeNull();
    expect(expectedCueResponseForLesson('qa-camera-no-dog')).toBeNull();
    expect(expectedCueResponseForLesson('qa-camera-tracking-loss')).toBeNull();

    expect(supportsAutomaticPostureScoring('qa-camera-four-paws')).toBe(false);
    expect(supportsAutomaticPostureScoring('qa-camera-no-dog')).toBe(false);
    expect(supportsAutomaticPostureScoring('qa-camera-tracking-loss')).toBe(false);
  });
});
