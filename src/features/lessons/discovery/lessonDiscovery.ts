import type { BehaviourSkill, LessonId } from '../../../domain/models';
import type { LessonLibraryItem } from '../library/lessonLibraryTypes';

export type LessonCollectionId = 'puppy' | 'adult' | 'senior' | 'rescue';

export type LessonDiscoveryScope =
  | { readonly type: 'all' }
  | { readonly type: 'skill'; readonly skill: BehaviourSkill }
  | { readonly type: 'collection'; readonly collectionId: LessonCollectionId }
  | { readonly type: 'recommended' };

export type TrainingCategory = {
  readonly skill: BehaviourSkill;
  readonly label: string;
  readonly shortLabel: string;
  readonly description: string;
  readonly anchorLessonId: LessonId;
};

export type LessonCollection = {
  readonly id: LessonCollectionId;
  readonly label: string;
  readonly ageLabel: string;
  readonly description: string;
  readonly anchorLessonId: LessonId;
  readonly lessonIds: readonly LessonId[];
};

export const trainingCategories: readonly TrainingCategory[] = Object.freeze([
  Object.freeze({ skill: 'house-training', label: 'House Training', shortLabel: 'House', description: 'Toileting routines, signals and reliability.', anchorLessonId: 'house-training-routine' }),
  Object.freeze({ skill: 'chewing', label: 'Chewing', shortLabel: 'Chewing', description: 'Safe chew choices, redirection and prevention.', anchorLessonId: 'chewing-appropriate-items' }),
  Object.freeze({ skill: 'barking', label: 'Barking', shortLabel: 'Barking', description: 'Understand triggers and build calmer responses.', anchorLessonId: 'barking-identify-triggers' }),
  Object.freeze({ skill: 'jumping', label: 'Jumping Up', shortLabel: 'Jumping', description: 'Four paws down and calmer greetings.', anchorLessonId: 'jumping-four-paws-down' }),
  Object.freeze({ skill: 'recall', label: 'Recall', shortLabel: 'Recall', description: 'Name response and reliable returns.', anchorLessonId: 'recall-name-response' }),
  Object.freeze({ skill: 'loose-lead-walking', label: 'Loose-Lead Walking', shortLabel: 'Loose Lead', description: 'Relaxed walking without constant pulling.', anchorLessonId: 'loose-lead-reward-zone' }),
  Object.freeze({ skill: 'focus', label: 'Focus', shortLabel: 'Focus', description: 'Attention, check-ins and distraction skills.', anchorLessonId: 'focus-check-in' }),
  Object.freeze({ skill: 'impulse-control', label: 'Impulse Control', shortLabel: 'Self-Control', description: 'Waiting, settling and thoughtful choices.', anchorLessonId: 'impulse-control-wait-for-reward' }),
  Object.freeze({ skill: 'confidence', label: 'Confidence', shortLabel: 'Confidence', description: 'Safer exploration and recovery from surprises.', anchorLessonId: 'confidence-choice-and-exploration' }),
  Object.freeze({ skill: 'reactivity', label: 'Reactivity', shortLabel: 'Reactivity', description: 'Distance, recovery and safe trigger work.', anchorLessonId: 'reactivity-safe-distance' }),
]);

export const lessonCollections: readonly LessonCollection[] = Object.freeze([
  Object.freeze({
    id: 'puppy',
    label: 'Puppy',
    ageLabel: 'Up to about 12 months',
    description: 'Short foundation lessons for toilet training, chewing, focus, greetings and early recall.',
    anchorLessonId: 'chewing-puppy-teething-plan',
    lessonIds: Object.freeze([
      'recall-name-response',
      'recall-short-distance',
      'focus-check-in',
      'focus-hold-attention',
      'jumping-four-paws-down',
      'jumping-calm-greetings',
      'chewing-appropriate-items',
      'chewing-redirection-routine',
      'chewing-puppy-teething-plan',
      'house-training-routine',
      'house-training-signal-and-reward',
      'house-training-accident-reset',
      'house-training-clear-outdoor-signal',
      'confidence-choice-and-exploration',
      'confidence-new-surfaces-and-sounds',
      'impulse-control-wait-for-reward',
      'impulse-control-settle-on-mat',
      'loose-lead-reward-zone',
    ]),
  }),
  Object.freeze({
    id: 'adult',
    label: 'Adult Dog',
    ageLabel: 'About 1 to 7 years',
    description: 'Build reliable everyday skills, solve current problems and maintain good habits.',
    anchorLessonId: 'loose-lead-longer-routes',
    lessonIds: Object.freeze([
      'recall-around-distractions',
      'recall-real-world-maintenance',
      'loose-lead-real-world-distractions',
      'loose-lead-sniffing-rewards',
      'loose-lead-longer-routes',
      'focus-around-distractions',
      'focus-real-world-duration',
      'jumping-visitors-and-excitement',
      'jumping-maintenance-in-public',
      'barking-real-world-management',
      'barking-doorbell-routine',
      'chewing-independence-and-prevention',
      'reactivity-controlled-exposure',
      'reactivity-generalisation-and-maintenance',
      'confidence-new-environments',
      'impulse-control-real-world-distractions',
      'impulse-control-maintenance-and-release',
      'house-training-reliability',
    ]),
  }),
  Object.freeze({
    id: 'senior',
    label: 'Senior Dog',
    ageLabel: 'Usually 7+ years',
    description: 'Gentle, lower-pressure lessons that support comfort, confidence and familiar routines.',
    anchorLessonId: 'confidence-consent-based-handling',
    lessonIds: Object.freeze([
      'recall-name-response',
      'recall-reward-reset',
      'focus-check-in',
      'focus-predictable-patterns',
      'barking-meet-needs-first',
      'barking-recovery-and-maintenance',
      'house-training-routine',
      'house-training-clear-outdoor-signal',
      'confidence-choice-and-exploration',
      'confidence-consent-based-handling',
      'confidence-recovery-after-surprise',
      'impulse-control-wait-for-reward',
      'impulse-control-settle-on-mat',
      'loose-lead-sniffing-rewards',
      'loose-lead-longer-routes',
    ]),
  }),
  Object.freeze({
    id: 'rescue',
    label: 'Rescue Dog',
    ageLabel: 'Any age',
    description: 'Patient, choice-led lessons for settling in, trust, safety, confidence and everyday routines.',
    anchorLessonId: 'confidence-recovery-after-surprise',
    lessonIds: Object.freeze([
      'recall-name-response',
      'recall-collar-touch-and-release',
      'focus-check-in',
      'focus-predictable-patterns',
      'jumping-four-paws-down',
      'jumping-station-on-a-mat',
      'barking-identify-triggers',
      'barking-meet-needs-first',
      'chewing-appropriate-items',
      'house-training-routine',
      'confidence-choice-and-exploration',
      'confidence-consent-based-handling',
      'confidence-recovery-after-surprise',
      'reactivity-safe-distance',
      'reactivity-emergency-u-turn',
      'reactivity-recovery-after-trigger',
      'impulse-control-settle-on-mat',
      'impulse-control-leave-it',
    ]),
  }),
]);

export function trainingCategoryForSkill(skill: BehaviourSkill): TrainingCategory {
  return trainingCategories.find((category) => category.skill === skill) ?? trainingCategories[0]!;
}

export function lessonCollectionById(id: LessonCollectionId): LessonCollection {
  return lessonCollections.find((collection) => collection.id === id) ?? lessonCollections[0]!;
}

export function lessonsInCollection(
  lessons: readonly LessonLibraryItem[],
  collectionId: LessonCollectionId,
): readonly LessonLibraryItem[] {
  const ids = new Set(lessonCollectionById(collectionId).lessonIds);
  return Object.freeze(lessons.filter((lesson) => ids.has(lesson.id)));
}


export function lessonsForDiscoveryScope(
  lessons: readonly LessonLibraryItem[],
  scope: LessonDiscoveryScope = { type: 'all' },
): readonly LessonLibraryItem[] {
  if (scope.type === 'skill') {
    return Object.freeze(lessons.filter((lesson) => lesson.skill === scope.skill));
  }
  if (scope.type === 'collection') {
    return lessonsInCollection(lessons, scope.collectionId);
  }
  if (scope.type === 'recommended') {
    return recommendedLessons(lessons, 12);
  }
  return lessons;
}

export function recommendedLessons(
  lessons: readonly LessonLibraryItem[],
  limit = 4,
): readonly LessonLibraryItem[] {
  if (limit <= 0) return Object.freeze([]);

  const unfinished = lessons
    .filter((lesson) => lesson.state === 'IN_PROGRESS' || lesson.state === 'AVAILABLE')
    .sort((left, right) => recommendationRank(left) - recommendationRank(right)
      || left.difficulty - right.difficulty
      || left.estimatedMinutes - right.estimatedMinutes
      || left.title.localeCompare(right.title));

  const completed = lessons
    .filter((lesson) => lesson.state === 'COMPLETED')
    .sort((left, right) => left.difficulty - right.difficulty || left.title.localeCompare(right.title));

  const ordered = [...unfinished, ...completed];
  const selected: LessonLibraryItem[] = [];
  const selectedIds = new Set<string>();
  const selectedSkills = new Set<BehaviourSkill>();

  for (const lesson of ordered) {
    if (selected.length >= limit) break;
    if (selectedSkills.has(lesson.skill)) continue;
    selected.push(lesson);
    selectedIds.add(lesson.id);
    selectedSkills.add(lesson.skill);
  }

  for (const lesson of ordered) {
    if (selected.length >= limit) break;
    if (selectedIds.has(lesson.id)) continue;
    selected.push(lesson);
    selectedIds.add(lesson.id);
  }

  return Object.freeze(selected);
}

function recommendationRank(lesson: LessonLibraryItem): number {
  if (lesson.state === 'IN_PROGRESS') return 0;
  if (lesson.state === 'AVAILABLE') return 1;
  if (lesson.state === 'COMPLETED') return 2;
  return 3;
}
