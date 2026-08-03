/**
 * Builds the Home welcome / progress message from existing real progress data
 * only — no new analytics store, no hard-coded statistics, and no unearned
 * performance claims ("above average", "excellent", "improving", "mastered").
 *
 * Inputs are derived from the shared lesson-progress source of truth:
 * - completedLessons: number of lessons in a completed state
 * - sessionCount: total saved training sessions (Σ attempts across progress)
 * - successRate: successfulCompletions / attempts, or null when no attempts
 */
export type HomeWelcomeInput = {
  readonly dogName: string | null;
  readonly completedLessons: number;
  readonly sessionCount: number;
  readonly successRate: number | null;
};

export type HomeWelcomeMessage = {
  readonly title: string;
  readonly lines: readonly string[];
};

function plural(count: number, singular: string): string {
  return count === 1 ? singular : `${singular}s`;
}

export function homeWelcomeMessage(input: HomeWelcomeInput): HomeWelcomeMessage {
  const name = input.dogName?.trim() ?? '';

  if (!name) {
    return {
      title: 'Welcome to Good Dog Academy',
      lines: ['Add your dog to begin a personalised training journey built around steady, positive progress.'],
    };
  }

  if (input.sessionCount <= 0 && input.completedLessons <= 0) {
    return {
      title: 'Welcome to Good Dog Academy',
      lines: [
        `You and ${name} are about to begin building great habits together. Keep the first sessions short, positive and easy.`,
        'The first lesson is ready whenever you are.',
      ],
    };
  }

  const progressLine = input.completedLessons > 0
    ? `${name} has completed ${input.completedLessons} ${plural(input.completedLessons, 'lesson')} so far.`
    : `${name} has practised ${input.sessionCount} ${plural(input.sessionCount, 'session')} so far.`;

  const performanceLine = performanceMessage(name, input.sessionCount, input.successRate);
  const reportLine = `For the complete report, open ${name}'s profile from the Dog section below.`;

  return {
    title: `Welcome back, ${name}`,
    lines: [progressLine, performanceLine, reportLine],
  };
}

function performanceMessage(name: string, sessionCount: number, successRate: number | null): string {
  // Not enough data to responsibly describe performance.
  if (successRate === null || sessionCount < 3) {
    return `Every positive repetition is helping ${name} learn.`;
  }
  if (successRate >= 0.7) {
    return `${name} is training with a strong success rate.`;
  }
  return `${name} is building consistency with every short practice.`;
}
