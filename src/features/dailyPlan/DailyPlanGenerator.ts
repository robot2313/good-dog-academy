import type { BehaviourProfile, LessonId, LessonProgress } from '../../domain/models';
import type { LessonCatalogue } from '../lessons/catalogue';
import { LessonEligibilityService } from '../lessons/eligibility';

export class DailyPlanGenerator {
  constructor(private readonly catalogue: LessonCatalogue) {}

  generate(profile: BehaviourProfile, dogAgeMonths: number, progress: readonly LessonProgress[], limit = 2, excludedLessonIds: readonly LessonId[] = []): LessonId[] {
    const excluded = new Set(excludedLessonIds);
    const eligibility = new LessonEligibilityService(this.catalogue);
    const candidates = this.catalogue.definitions
      .map((lesson) => ({ lesson, result: eligibility.evaluate(lesson.id, dogAgeMonths, progress) }))
      .filter(({ lesson, result }) => result.eligible && !excluded.has(lesson.id))
      .sort((a, b) => {
        const learningOrder = Number(b.result.canBeNewLearning) - Number(a.result.canBeNewLearning);
        if (learningOrder !== 0) return learningOrder;
        const inProgressOrder = Number(b.result.status === 'inProgress') - Number(a.result.status === 'inProgress');
        if (inProgressOrder !== 0) return inProgressOrder;
        const unknownA = Number(profile.unknownSkills.includes(a.lesson.skill));
        const unknownB = Number(profile.unknownSkills.includes(b.lesson.skill));
        if (unknownA !== unknownB) return unknownA - unknownB;
        const scoreOrder = profile.skillScores[a.lesson.skill] - profile.skillScores[b.lesson.skill];
        if (scoreOrder !== 0) return scoreOrder;
        return a.lesson.difficultyLevel - b.lesson.difficultyLevel || a.lesson.id.localeCompare(b.lesson.id);
      });

    const selected: LessonId[] = [];
    const selectedSkills = new Set<string>();
    for (const candidate of candidates) {
      if (selected.length >= limit) break;
      if (selectedSkills.has(candidate.lesson.skill) && candidates.some(({ lesson }) => !selectedSkills.has(lesson.skill))) continue;
      selected.push(candidate.lesson.id);
      selectedSkills.add(candidate.lesson.skill);
    }
    return selected;
  }
}

export function dogAgeInMonths(dateOfBirth: string | null, estimatedAgeYears: number | null, now: Date): number {
  if (dateOfBirth) {
    const birth = new Date(`${dateOfBirth}T00:00:00.000Z`);
    let months = (now.getUTCFullYear() - birth.getUTCFullYear()) * 12 + now.getUTCMonth() - birth.getUTCMonth();
    if (now.getUTCDate() < birth.getUTCDate()) months -= 1;
    return Math.max(0, months);
  }
  return Math.max(0, Math.round((estimatedAgeYears ?? 0) * 12));
}
