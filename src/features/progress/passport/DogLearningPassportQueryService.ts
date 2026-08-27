import type {
  BehaviourSkill,
  LessonProgress,
  TrainingOutcome,
  TrainingSession,
  TroubleshooterAttempt,
  TroubleshooterOutcome,
} from '../../../domain/models';
import { behaviourSkills } from '../../../domain/models';
import type { DomainRepositories } from '../../../domain/repositories';
import { RepositoryValidationError } from '../../../storage/AsyncStorageRepository';
import type { LessonCatalogue } from '../../lessons/catalogue';
import { concernForId } from '../../troubleshooter/troubleshooterCatalogue';
import {
  isValidTimeZone,
  LocalCalendarDateError,
  toLocalCalendarDate,
} from '../time/localCalendarDate';
import { DogLearningPassportError } from './DogLearningPassportError';
import type {
  DogLearningPassport,
  GetDogLearningPassportRequest,
  PassportEvidenceLevel,
  PassportNextStep,
  PassportSkillRecord,
  PassportTimelineItem,
  PassportTimelineTone,
} from './DogLearningPassportTypes';

type PassportRepositories = Pick<
  DomainRepositories,
  'owners' | 'dogs' | 'lessonProgress' | 'trainingSessions' | 'troubleshooterAttempts'
>;

type MutableSkillEvidence = {
  completedLessons: number;
  activeLessons: number;
  lessonAttempts: number;
  completedSessions: number;
  successfulSessions: number;
  helpAttempts: number;
  positiveHelpAttempts: number;
  improvingEnvironments: Set<string>;
  reliableEnvironments: Set<string>;
  latestHelpOutcome: TroubleshooterOutcome | null;
  latestHelpAt: string | null;
  latestActivityAt: string | null;
};

const maximumTimelineItems = 8;

export class DogLearningPassportQueryService {
  constructor(
    private readonly repositories: PassportRepositories,
    private readonly catalogue: LessonCatalogue,
  ) {}

  async get(request: GetDogLearningPassportRequest): Promise<DogLearningPassport> {
    validateRequest(request);

    try {
      const [owner, dog] = await Promise.all([
        this.repositories.owners.findById(request.ownerId),
        this.repositories.dogs.findById(request.dogId),
      ]);
      if (!owner) throw new DogLearningPassportError('OWNER_NOT_FOUND', { ownerId: request.ownerId });
      if (!dog) throw new DogLearningPassportError('DOG_NOT_FOUND', { dogId: request.dogId });
      if (dog.ownerId !== owner.id) {
        throw new DogLearningPassportError('DOG_OWNERSHIP_MISMATCH', {
          ownerId: owner.id,
          dogId: dog.id,
        });
      }

      const [allProgress, allSessions, allAttempts] = await Promise.all([
        this.repositories.lessonProgress.findAll(),
        this.repositories.trainingSessions.findAll(),
        this.repositories.troubleshooterAttempts.findAll(),
      ]);
      const progress = allProgress.filter((record) => record.dogId === dog.id);
      if (progress.some((record) => record.ownerId !== owner.id)) {
        throw new DogLearningPassportError('PROGRESS_OWNERSHIP_MISMATCH', {
          ownerId: owner.id,
          dogId: dog.id,
        });
      }
      const sessions = allSessions
        .filter((session) => session.dogId === dog.id)
        .filter(isCompletedSession);
      const dogAttempts = allAttempts.filter((attempt) => attempt.dogId === dog.id);
      if (dogAttempts.some((attempt) => attempt.ownerId !== owner.id)) {
        throw new DogLearningPassportError('HISTORY_OWNERSHIP_MISMATCH', {
          ownerId: owner.id,
          dogId: dog.id,
        });
      }
      const attempts = dogAttempts;

      return this.build(dog.id, progress, sessions, attempts, request.timeZone);
    } catch (cause) {
      throw toPassportError(cause, request.ownerId, request.dogId);
    }
  }

  private build(
    dogId: string,
    progress: readonly LessonProgress[],
    sessions: readonly (TrainingSession & { completedAt: string; outcome: TrainingOutcome })[],
    attempts: readonly TroubleshooterAttempt[],
    timeZone: string,
  ): DogLearningPassport {
    const bySkill = new Map<BehaviourSkill, MutableSkillEvidence>(
      behaviourSkills.map((skill) => [skill, emptyEvidence()]),
    );

    for (const record of progress) {
      const lesson = this.catalogue.findById(record.lessonId);
      if (!lesson) continue;
      const evidence = bySkill.get(lesson.skill);
      if (!evidence) continue;
      evidence.completedLessons += Number(record.status === 'completed');
      evidence.activeLessons += Number(record.status === 'inProgress');
      evidence.lessonAttempts += record.attempts;
      evidence.latestActivityAt = newestTimestamp(evidence.latestActivityAt, record.lastAttemptedAt);
    }

    for (const session of sessions) {
      const skill = this.catalogue.findById(session.lessonId)?.skill ?? null;
      if (!skill) continue;
      const evidence = bySkill.get(skill);
      if (!evidence) continue;
      evidence.completedSessions += 1;
      evidence.successfulSessions += Number(session.outcome === 'success');
      evidence.latestActivityAt = newestTimestamp(evidence.latestActivityAt, session.completedAt);
    }

    for (const attempt of attempts) {
      const skill = concernForId(attempt.topicId).lessonSkill;
      const evidence = bySkill.get(skill);
      if (!evidence) continue;
      evidence.helpAttempts += 1;
      evidence.positiveHelpAttempts += Number(isPositiveHelpOutcome(attempt.outcome));
      if (isPositiveHelpOutcome(attempt.outcome)) evidence.improvingEnvironments.add(attempt.environment);
      if (attempt.outcome === 'reliable') evidence.reliableEnvironments.add(attempt.environment);
      if (!evidence.latestHelpAt || attempt.createdAt > evidence.latestHelpAt) {
        evidence.latestHelpAt = attempt.createdAt;
        evidence.latestHelpOutcome = attempt.outcome;
      }
      evidence.latestActivityAt = newestTimestamp(evidence.latestActivityAt, attempt.createdAt);
    }

    const skills = Object.freeze(behaviourSkills.map((skill) => toSkillRecord(skill, bySkill.get(skill) ?? emptyEvidence())));
    const environments = new Set(attempts.map((attempt) => attempt.environment.trim()).filter(Boolean));

    return Object.freeze({
      dogId,
      snapshot: Object.freeze({
        completedLessons: progress.filter((record) => record.status === 'completed').length,
        activeLessons: progress.filter((record) => record.status === 'inProgress').length,
        completedSessions: sessions.length,
        successfulSessions: sessions.filter((session) => session.outcome === 'success').length,
        trainingMinutes: sessions.reduce((total, session) => total + session.durationMinutes, 0),
        recordedEnvironments: environments.size,
      }),
      skills,
      timeline: buildTimeline(sessions, attempts, this.catalogue, timeZone),
      nextStep: selectNextStep(progress, attempts, this.catalogue),
    });
  }
}

function validateRequest(request: GetDogLearningPassportRequest): void {
  if (!request.ownerId.trim()) throw new DogLearningPassportError('INVALID_OWNER_ID');
  if (!request.dogId.trim()) throw new DogLearningPassportError('INVALID_DOG_ID');
  if (!isValidTimeZone(request.timeZone)) throw new DogLearningPassportError('INVALID_TIMEZONE');
}

function emptyEvidence(): MutableSkillEvidence {
  return {
    completedLessons: 0,
    activeLessons: 0,
    lessonAttempts: 0,
    completedSessions: 0,
    successfulSessions: 0,
    helpAttempts: 0,
    positiveHelpAttempts: 0,
    improvingEnvironments: new Set<string>(),
    reliableEnvironments: new Set<string>(),
    latestHelpOutcome: null,
    latestHelpAt: null,
    latestActivityAt: null,
  };
}

function toSkillRecord(skill: BehaviourSkill, evidence: MutableSkillEvidence): PassportSkillRecord {
  return Object.freeze({
    skill,
    title: titleCase(skill),
    evidenceLevel: evidenceLevel(evidence),
    completedLessons: evidence.completedLessons,
    activeLessons: evidence.activeLessons,
    completedSessions: evidence.completedSessions,
    successfulSessions: evidence.successfulSessions,
    helpAttempts: evidence.helpAttempts,
    improvingEnvironments: Object.freeze([...evidence.improvingEnvironments].sort()),
    reliableEnvironments: Object.freeze([...evidence.reliableEnvironments].sort()),
    latestHelpOutcome: evidence.latestHelpOutcome,
    latestActivityAt: evidence.latestActivityAt,
  });
}

function evidenceLevel(evidence: MutableSkillEvidence): PassportEvidenceLevel {
  if (evidence.reliableEnvironments.size > 0) return 'reliable';
  if (evidence.completedLessons > 0 || evidence.successfulSessions > 0 || evidence.positiveHelpAttempts > 0) return 'growing';
  if (evidence.activeLessons > 0 || evidence.lessonAttempts > 0 || evidence.completedSessions > 0 || evidence.helpAttempts > 0) return 'started';
  return 'not-recorded';
}

function buildTimeline(
  sessions: readonly (TrainingSession & { completedAt: string; outcome: TrainingOutcome })[],
  attempts: readonly TroubleshooterAttempt[],
  catalogue: LessonCatalogue,
  timeZone: string,
): readonly PassportTimelineItem[] {
  const sessionItems = sessions.map<PassportTimelineItem>((session) => {
    const lesson = catalogue.findById(session.lessonId);
    return Object.freeze({
      id: `session:${session.id}`,
      kind: 'training-session',
      title: lesson?.title ?? 'Unknown lesson',
      detail: `${trainingOutcomeLabel(session.outcome)} · ${session.durationMinutes} min`,
      occurredAt: session.completedAt,
      localDate: toLocalCalendarDate(session.completedAt, timeZone),
      tone: trainingTone(session.outcome),
      sessionId: session.id,
    });
  });
  const helpItems = attempts.map<PassportTimelineItem>((attempt) => Object.freeze({
    id: `help:${attempt.id}`,
    kind: 'help-now',
    title: concernForId(attempt.topicId).title,
    detail: `${helpOutcomeLabel(attempt.outcome)} · ${attempt.environment}`,
    occurredAt: attempt.createdAt,
    localDate: toLocalCalendarDate(attempt.createdAt, timeZone),
    tone: helpTone(attempt.outcome),
    sessionId: null,
  }));
  return Object.freeze([...sessionItems, ...helpItems]
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt) || left.id.localeCompare(right.id))
    .slice(0, maximumTimelineItems));
}

function selectNextStep(
  progress: readonly LessonProgress[],
  attempts: readonly TroubleshooterAttempt[],
  catalogue: LessonCatalogue,
): PassportNextStep {
  const latestAttempt = [...attempts].sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null;
  if (latestAttempt && (latestAttempt.outcome === 'worse' || latestAttempt.outcome === 'no-change')) {
    const concern = concernForId(latestAttempt.topicId);
    return Object.freeze({
      kind: 'help-now',
      title: `Recheck: ${concern.title}`,
      reason: latestAttempt.outcome === 'worse'
        ? 'The latest real-world attempt felt worse, so safety and difficulty should be checked before repeating it.'
        : 'The latest attempt showed no change, so Help Me Now can move to the next fallback instead of repeating the same step.',
      lessonId: null,
    });
  }

  const inProgress = progress
    .filter((record) => record.status === 'inProgress' && catalogue.findById(record.lessonId)?.isActive)
    .sort((left, right) => (right.lastAttemptedAt ?? '').localeCompare(left.lastAttemptedAt ?? ''))[0];
  if (inProgress) {
    const lesson = catalogue.requireById(inProgress.lessonId);
    return Object.freeze({
      kind: 'lesson',
      title: `Continue ${lesson.title}`,
      reason: 'Continue the skill already in progress before adding a harder one.',
      lessonId: lesson.id,
    });
  }

  const available = progress
    .map((record) => ({ record, lesson: catalogue.findById(record.lessonId) }))
    .filter((item): item is { record: LessonProgress; lesson: NonNullable<typeof item.lesson> } => item.record.status === 'available' && item.lesson?.isActive === true)
    .sort((left, right) => left.lesson.difficultyLevel - right.lesson.difficultyLevel || left.lesson.id.localeCompare(right.lesson.id))[0];
  if (available) {
    return Object.freeze({
      kind: 'lesson',
      title: `Start ${available.lesson.title}`,
      reason: 'This is the easiest available lesson supported by the current progress record.',
      lessonId: available.lesson.id,
    });
  }

  return Object.freeze({
    kind: 'academy',
    title: 'Browse the Academy',
    reason: 'Review the available lesson paths and choose an appropriate next skill.',
    lessonId: null,
  });
}

function isCompletedSession(session: TrainingSession): session is TrainingSession & { completedAt: string; outcome: TrainingOutcome } {
  return session.completedAt !== null && session.outcome !== null;
}

function isPositiveHelpOutcome(outcome: TroubleshooterOutcome): boolean {
  return outcome === 'slightly-better' || outcome === 'successful-once' || outcome === 'successful-three-times' || outcome === 'reliable';
}

function newestTimestamp(current: string | null, candidate: string | null): string | null {
  if (!candidate) return current;
  return !current || candidate > current ? candidate : current;
}

function titleCase(skill: BehaviourSkill): string {
  return skill.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function trainingOutcomeLabel(outcome: TrainingOutcome): string {
  if (outcome === 'success') return 'Successful session';
  if (outcome === 'partial-success') return 'Partly successful session';
  return 'Unsuccessful session';
}

function helpOutcomeLabel(outcome: TroubleshooterOutcome): string {
  if (outcome === 'slightly-better') return 'A little better';
  if (outcome === 'successful-once') return 'Worked once';
  if (outcome === 'successful-three-times') return 'Worked three times';
  if (outcome === 'reliable') return 'Reliable here';
  if (outcome === 'no-change') return 'No change';
  return 'Worse';
}

function trainingTone(outcome: TrainingOutcome): PassportTimelineTone {
  if (outcome === 'success') return 'positive';
  if (outcome === 'partial-success') return 'neutral';
  return 'caution';
}

function helpTone(outcome: TroubleshooterOutcome): PassportTimelineTone {
  if (isPositiveHelpOutcome(outcome)) return 'positive';
  return 'caution';
}

function toPassportError(cause: unknown, ownerId: string, dogId: string): DogLearningPassportError {
  if (cause instanceof DogLearningPassportError) return cause;
  if (cause instanceof RepositoryValidationError || cause instanceof LocalCalendarDateError) {
    return new DogLearningPassportError('CORRUPT_STORED_DATA', { ownerId, dogId }, { cause });
  }
  return new DogLearningPassportError('READ_FAILED', { ownerId, dogId }, { cause });
}
