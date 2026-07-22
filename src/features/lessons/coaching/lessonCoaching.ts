import type { BehaviourSkill, LessonDefinition } from '../../../domain/models';

export interface LessonFlowStage {
  readonly title: 'Set up' | 'Coach' | 'Finish well';
  readonly description: string;
}

const encouragementBySkill: Readonly<Record<BehaviourSkill, string>> = Object.freeze({
  recall: 'Every happy return you reward makes choosing you more worthwhile next time.',
  'loose-lead-walking':
    'A handful of relaxed steps is real progress. Quality matters more than distance.',
  focus:
    'Attention offered freely is valuable. Notice and celebrate even the smallest check-in.',
  jumping:
    'Calm greetings grow through repetition and management, not perfection in one session.',
  barking:
    'Barking is communication. Learning what your dog needs is progress, even before the sound changes.',
  chewing:
    'Good choices become easier when the safe option is available, rewarding, and easy to reach.',
  reactivity:
    'Creating distance is successful training. Safety and recovery always count as a win.',
  'house-training':
    'Accidents are information, not failure. A steady routine gives your dog the clearest path forward.',
  confidence:
    'Choosing to pause, watch, or retreat can be brave. Let your dog set a comfortable pace.',
  'impulse-control':
    'Tiny comfortable pauses build better self-control than long, frustrating waits.',
});

const levelEncouragement: Readonly<Record<LessonDefinition['difficultyLevel'], string>> =
  Object.freeze({
    1: 'Keep the first wins small and easy, and finish while your dog still wants more.',
    2: 'Returning to the foundation is smart coaching whenever this version feels difficult.',
    3: 'Real-world reliability grows in layers; distance and good management are part of success.',
    4: 'Protect confidence as the challenge grows, changing only one difficulty at a time.',
    5: 'Advanced practice should still look relaxed, safe, and achievable for your individual dog.',
  });

export function createLessonFlow(lesson: LessonDefinition): readonly LessonFlowStage[] {
  const middleIndex = Math.floor((lesson.steps.length - 1) / 2);

  return Object.freeze([
    Object.freeze({
      title: 'Set up',
      description: shorten(stripNumber(lesson.steps[0] ?? lesson.goal)),
    }),
    Object.freeze({
      title: 'Coach',
      description: shorten(stripNumber(lesson.steps[middleIndex] ?? lesson.goal)),
    }),
    Object.freeze({
      title: 'Finish well',
      description: shorten(
        stripNumber(lesson.steps[lesson.steps.length - 1] ?? lesson.goal),
      ),
    }),
  ]);
}

export function lessonEncouragement(lesson: LessonDefinition): string {
  return `${encouragementBySkill[lesson.skill]} ${levelEncouragement[lesson.difficultyLevel]}`;
}

export function lessonDiagramLabel(lesson: LessonDefinition): string {
  return `${createLessonFlow(lesson)
    .map(
      (stage) =>
        `${stage.title}: ${stage.description.replace(/[.!?…]+$/, '')}`,
    )
    .join('. Then ')}.`;
}

function stripNumber(value: string): string {
  return value.replace(/^\d+\.\s*/, '');
}

function shorten(value: string, maximumLength = 105): string {
  if (value.length <= maximumLength) return value;
  const shortened = value.slice(0, maximumLength - 1);
  const lastSpace = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, lastSpace > 60 ? lastSpace : shortened.length)}…`;
}
