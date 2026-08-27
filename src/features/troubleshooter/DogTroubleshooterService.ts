import type {
  TroubleshooterAttempt,
  TroubleshooterFailureCategory,
  TroubleshooterFallbackLevel,
} from '../../domain/models';
import type { LessonLibraryService } from '../lessons/library/LessonLibraryService';
import type { LessonLibraryItem, LessonState } from '../lessons/library/lessonLibraryTypes';
import { concernForId } from './troubleshooterCatalogue';
import { protocolForTopic } from './troubleshooterProtocols';
import type {
  ResolvedTroubleshooterResult,
  TroubleshooterDiagnosticAnswers,
  TroubleshooterExercise,
  TroubleshooterSafetyOverride,
} from './troubleshooterTypes';

const statePriority: Readonly<Record<LessonState, number>> = Object.freeze({
  IN_PROGRESS: 0,
  AVAILABLE: 1,
  COMPLETED: 2,
  LOCKED: 3,
});

const categoryAdjustments: Readonly<Record<TroubleshooterFailureCategory, {
  likelyObstacle: string;
  primaryAdjustment: string;
}>> = Object.freeze({
  high_distraction: {
    likelyObstacle: 'The current distraction is stronger than the skill at this distance.',
    primaryAdjustment: 'Add distance or use a quieter setting until your dog can eat, respond, and recover.',
  },
  difficulty_increased_too_quickly: {
    likelyObstacle: 'Duration, distance, or distraction increased before the easier step was reliable.',
    primaryAdjustment: 'Return to the last easy version and change only one difficulty factor.',
  },
  reward_not_effective: {
    likelyObstacle: 'The reward is not valuable enough in this context or arrives too late.',
    primaryAdjustment: 'Use a reward your dog values here and deliver it immediately after the desired behaviour.',
  },
  cue_not_understood: {
    likelyObstacle: 'The cue may be unclear, repeated, or different from the version your dog learned.',
    primaryAdjustment: 'Use one consistent cue in an easy setting and reward the smallest correct response.',
  },
  not_generalised: {
    likelyObstacle: 'The skill works in one familiar setup but has not transferred to this environment.',
    primaryAdjustment: 'Recreate the easiest successful version here with shorter distance and fewer distractions.',
  },
  handler_timing_or_cue_issue: {
    likelyObstacle: 'Food position, cue timing, or reward timing may be prompting a different response.',
    primaryAdjustment: 'Keep food hidden until after the behaviour and mark the exact successful moment.',
  },
  session_too_long_or_dog_disengaged: {
    likelyObstacle: 'The session is continuing after useful engagement has faded.',
    primaryAdjustment: 'Use one to three successful repetitions and finish while your dog is still engaged.',
  },
  overexcited_frustrated_or_fearful: {
    likelyObstacle: 'Excitement, frustration, worry, or unmet needs are interfering with learning.',
    primaryAdjustment: 'Reduce pressure, meet immediate needs, and begin in a calmer setup with room to move away.',
  },
});

export class DogTroubleshooterService {
  constructor(private readonly library: Pick<LessonLibraryService, 'getAllLessons'>) {}

  recommend(
    answers: TroubleshooterDiagnosticAnswers,
    history: readonly TroubleshooterAttempt[] = [],
  ): ResolvedTroubleshooterResult {
    const concern = concernForId(answers.topicId);
    const scenario = concern.scenarios.find((candidate) => candidate.id === answers.scenarioId);
    if (!scenario) throw new Error(`Unknown scenario ${answers.scenarioId} for ${answers.topicId}`);
    const failureCategory = resolveFailureCategory(answers, scenario.failureCategory);
    const protocol = protocolForTopic(answers.topicId);
    const latest = latestMatchingAttempt(history, answers.topicId, answers.scenarioId);
    const fallbackLevel = nextFallbackLevel(latest);
    const adjustment = categoryAdjustments[failureCategory];
    const lessons = selectLessons(this.library.getAllLessons(), concern.lessonSkill, protocol.relatedLessonIds);

    return Object.freeze({
      concern,
      scenario,
      failureCategory,
      fallbackLevel,
      protocol,
      likelyObstacle: adjustment.likelyObstacle || protocol.likelyObstacle,
      primaryAdjustment: adjustmentForLevel(protocol, adjustment.primaryAdjustment, fallbackLevel),
      exercise: exerciseForLevel(protocol.exercise, protocol.fallbackLevel2, protocol.fallbackLevel3, fallbackLevel),
      selectionExplanation: `${scenario.selectionReason} You also reported that ${responseSummary(answers)}.`,
      progressMessage: progressMessage(latest),
      safetyOverride: resolveSafetyOverride(answers),
      primaryLesson: lessons[0] ? Object.freeze({ lesson: lessons[0], reason: recommendationReason(lessons[0]) }) : null,
      alternativeLessons: Object.freeze(lessons.slice(1, 3).map((lesson) => Object.freeze({ lesson, reason: recommendationReason(lesson) }))),
    });
  }
}

function resolveFailureCategory(
  answers: TroubleshooterDiagnosticAnswers,
  scenarioCategory: TroubleshooterFailureCategory,
): TroubleshooterFailureCategory {
  if (answers.bodyState === 'excited-or-frustrated' || answers.bodyState === 'worried-or-avoiding') return 'overexcited_frustrated_or_fearful';
  switch (answers.responseState) {
    case 'distraction-too-strong': return 'high_distraction';
    case 'difficulty-was-increased': return 'difficulty_increased_too_quickly';
    case 'usual-reward-not-working': return 'reward_not_effective';
    case 'cue-seems-unclear': return 'cue_not_understood';
    case 'works-only-in-familiar-place': return 'not_generalised';
    case 'timing-or-visible-help': return 'handler_timing_or_cue_issue';
    case 'disengages-quickly': return 'session_too_long_or_dog_disengaged';
    case 'can-eat-and-respond': return scenarioCategory;
  }
}

function latestMatchingAttempt(
  history: readonly TroubleshooterAttempt[],
  topicId: TroubleshooterDiagnosticAnswers['topicId'],
  scenarioId: string,
): TroubleshooterAttempt | null {
  return history
    .filter((attempt) => attempt.topicId === topicId && attempt.scenarioId === scenarioId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

function nextFallbackLevel(latest: TroubleshooterAttempt | null): TroubleshooterFallbackLevel {
  if (!latest) return 1;
  if (latest.outcome === 'no-change') return Math.min(3, latest.fallbackLevel + 1) as TroubleshooterFallbackLevel;
  if (latest.outcome === 'worse') return Math.max(1, latest.fallbackLevel - 1) as TroubleshooterFallbackLevel;
  return latest.fallbackLevel;
}

function adjustmentForLevel(
  protocol: ReturnType<typeof protocolForTopic>,
  categoryAdjustment: string,
  level: TroubleshooterFallbackLevel,
): string {
  if (level === 2) return protocol.fallbackLevel2[0] ?? categoryAdjustment;
  if (level === 3) return protocol.fallbackLevel3[0] ?? categoryAdjustment;
  return categoryAdjustment;
}

function exerciseForLevel(
  base: TroubleshooterExercise,
  fallback2: readonly string[],
  fallback3: readonly string[],
  level: TroubleshooterFallbackLevel,
): TroubleshooterExercise {
  if (level === 1) return base;
  const fallbackSteps = level === 2 ? fallback2 : fallback3;
  return Object.freeze({
    ...base,
    title: `${base.title} — level ${level}`,
    steps: Object.freeze([...fallbackSteps.map((step) => `Adjustment: ${step}`), ...base.steps]),
    repetitions: level === 3 ? 'Use one easy attempt only. Stop and use the professional guidance if it does not help.' : base.repetitions,
  });
}

function progressMessage(latest: TroubleshooterAttempt | null): string | null {
  if (!latest) return null;
  switch (latest.outcome) {
    case 'worse': return 'The previous attempt felt worse. This plan lowers the difficulty; recheck fear, frustration, pain, and safety before trying again.';
    case 'no-change': return latest.fallbackLevel >= 3
      ? 'There was still no change at the final fallback. Use management and the professional guidance instead of repeating the same exercise.'
      : 'There was no change, so the app has moved to the next fallback level.';
    case 'slightly-better': return 'There was a small improvement. Repeat this same level before making it harder.';
    case 'successful-once': return 'One success is useful, but it is not mastery. Repeat this level in the same environment.';
    case 'successful-three-times': return 'Three successes allow one small increase in duration, distance, or distraction—not all three.';
    case 'reliable': return `This is reliable in ${latest.environment} only. Start easier again in every new environment.`;
  }
}

function resolveSafetyOverride(answers: TroubleshooterDiagnosticAnswers): TroubleshooterSafetyOverride | null {
  if (answers.bodyState === 'injury-child-or-control-risk') {
    return Object.freeze({
      title: 'Stop and make the situation safe',
      message: 'Do not continue an app exercise where a child, person, animal, traffic, or loss-of-control risk is present.',
      actions: Object.freeze(['Create distance and use secure barriers without confronting the dog.', 'Keep children and vulnerable people completely separate.', 'Contact a veterinarian and qualified reward-based behaviour professional promptly.']),
      urgency: 'urgent',
    });
  }
  if (answers.bodyState === 'panic-snapping-or-aggression') {
    return Object.freeze({
      title: 'Training stops here for safety',
      message: 'Panic, repeated snapping, aggression, serious fighting, or self-injury needs an individual safety plan, not a general app exercise.',
      actions: Object.freeze(['End exposure and create distance or a secure barrier.', 'Do not punish growling or force contact.', 'Contact a veterinarian and qualified behaviour professional. Seek urgent veterinary care for injury.']),
      urgency: 'urgent',
    });
  }
  if (answers.bodyState === 'possible-pain-or-sudden-change') {
    return Object.freeze({
      title: 'Check health before training',
      message: 'A sudden behaviour change or possible pain can alter movement, learning, toileting, sleep, and reactions.',
      actions: Object.freeze(['Pause the exercise and avoid movements or situations that appear uncomfortable.', 'Record when the change began and any physical or toileting signs.', 'Arrange veterinary advice before treating it as a training problem.']),
      urgency: 'prompt',
    });
  }
  return null;
}

function selectLessons(
  lessons: readonly LessonLibraryItem[],
  skill: LessonLibraryItem['skill'],
  relatedIds: readonly string[],
): readonly LessonLibraryItem[] {
  return Object.freeze(lessons
    .filter((lesson) => lesson.skill === skill)
    .sort((a, b) => relatedRank(a.id, relatedIds) - relatedRank(b.id, relatedIds)
      || statePriority[a.state] - statePriority[b.state]
      || a.difficulty - b.difficulty
      || a.id.localeCompare(b.id)));
}

function relatedRank(id: string, relatedIds: readonly string[]): number {
  const index = relatedIds.indexOf(id);
  return index === -1 ? relatedIds.length : index;
}

function recommendationReason(lesson: LessonLibraryItem): string {
  switch (lesson.state) {
    case 'IN_PROGRESS': return 'Continue this related lesson after the immediate exercise is working.';
    case 'AVAILABLE': return 'This related lesson can support the next stage.';
    case 'COMPLETED': return 'Revisit this related lesson to reinforce the skill.';
    case 'LOCKED': return `This related lesson is for later; ${lesson.lock.reason.charAt(0).toLowerCase()}${lesson.lock.reason.slice(1)}`;
  }
}

function responseSummary(answers: TroubleshooterDiagnosticAnswers): string {
  const body = answers.bodyState.replaceAll('-', ' ');
  const response = answers.responseState.replaceAll('-', ' ');
  return `your dog is ${body} and ${response}`;
}
