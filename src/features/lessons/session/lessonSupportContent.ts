import type { LessonDefinition } from '../../../domain/models';

/**
 * Reorganises the real supporting content already attached to a lesson so the
 * "Before You Begin" screen can present, in one place, the coaching guidance
 * that previously appeared piecemeal beside each individual training step.
 *
 * Rules:
 * - Only existing lesson content is used — nothing is invented.
 * - Repeated advice is shown once (case-insensitive de-duplication) while the
 *   first occurrence's original wording is preserved.
 * - No unique problem, adjustment or tip is discarded; each real value maps to
 *   exactly one section.
 */
export type LessonSupportContent = {
  readonly overview: string;
  readonly aim: string | null;
  readonly safetyNotes: readonly string[];
  readonly coachingTips: readonly string[];
  readonly thingsThatMightGoWrong: readonly string[];
  readonly waysToMakeEasier: readonly string[];
};

function dedupe(values: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return Object.freeze(result);
}

export function lessonSupportContent(lesson: LessonDefinition): LessonSupportContent {
  return Object.freeze({
    overview: lesson.goal.trim(),
    aim: lesson.completionCriteria.description.trim() || null,
    safetyNotes: dedupe(lesson.safetyNotes),
    // Coaching tips previously shown one-per-step, gathered and de-duplicated.
    coachingTips: dedupe(lesson.tips),
    // The likely problems: common mistakes plus every "If this isn't working"
    // problem, so nothing unique from either source is lost.
    thingsThatMightGoWrong: dedupe([
      ...lesson.commonMistakes,
      ...lesson.troubleshooting.map((item) => item.problem),
    ]),
    // The practical adjustments / easier setups drawn from the troubleshooting
    // solutions already written for this lesson.
    waysToMakeEasier: dedupe(lesson.troubleshooting.map((item) => item.solution)),
  });
}
