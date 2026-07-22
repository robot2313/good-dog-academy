import type { LessonPerformanceRating } from '../../../domain/models';

export type GuidedSessionPhase =
  | 'prepare'
  | 'training'
  | 'feedback'
  | 'saving'
  | 'complete'
  | 'cancelled';

export type GuidedSessionState = {
  readonly phase: GuidedSessionPhase;
  readonly sessionId: string;
  readonly startedAt: string | null;
  readonly currentStep: number;
  readonly furthestStep: number;
  readonly remainingSeconds: number;
  readonly running: boolean;
  readonly successfulRepetitions: number;
  readonly needsHelpRepetitions: number;
  readonly consecutiveChallenges: number;
  readonly resetSuggested: boolean;
  readonly selectedRating: LessonPerformanceRating | null;
};

export type GuidedSessionAction =
  | { readonly type: 'begin'; readonly startedAt: string }
  | { readonly type: 'tick' }
  | { readonly type: 'pause' }
  | { readonly type: 'resume' }
  | { readonly type: 'previous'; readonly stepCount: number }
  | { readonly type: 'next'; readonly stepCount: number }
  | { readonly type: 'recordSuccess' }
  | { readonly type: 'recordChallenge' }
  | { readonly type: 'acceptReset' }
  | { readonly type: 'finish' }
  | { readonly type: 'returnToTraining' }
  | { readonly type: 'selectRating'; readonly rating: LessonPerformanceRating }
  | { readonly type: 'submit' }
  | { readonly type: 'saveSucceeded' }
  | { readonly type: 'saveFailed' }
  | { readonly type: 'cancel' };

export function createGuidedSessionState(
  estimatedMinutes: number,
  sessionId: string,
): GuidedSessionState {
  if (!sessionId.trim()) throw new RangeError('sessionId must not be empty');
  const safeMinutes = Number.isFinite(estimatedMinutes)
    ? Math.max(1, Math.round(estimatedMinutes))
    : 1;

  return {
    phase: 'prepare',
    sessionId,
    startedAt: null,
    currentStep: 0,
    furthestStep: 0,
    remainingSeconds: safeMinutes * 60,
    running: false,
    successfulRepetitions: 0,
    needsHelpRepetitions: 0,
    consecutiveChallenges: 0,
    resetSuggested: false,
    selectedRating: null,
  };
}

export function guidedSessionReducer(
  state: GuidedSessionState,
  action: GuidedSessionAction,
): GuidedSessionState {
  switch (action.type) {
    case 'begin':
      return state.phase === 'prepare' && isIsoTimestamp(action.startedAt)
        ? {
            ...state,
            phase: 'training',
            startedAt: action.startedAt,
            running: state.remainingSeconds > 0,
          }
        : state;
    case 'tick': {
      if (state.phase !== 'training' || !state.running || state.remainingSeconds === 0) {
        return state;
      }
      const remainingSeconds = state.remainingSeconds - 1;
      return { ...state, remainingSeconds, running: remainingSeconds > 0 };
    }
    case 'pause':
      return state.phase === 'training' && state.running
        ? { ...state, running: false }
        : state;
    case 'resume':
      return state.phase === 'training' && !state.running && state.remainingSeconds > 0
        && !state.resetSuggested
        ? { ...state, running: true }
        : state;
    case 'previous':
      return state.phase === 'training' && validStepCount(action.stepCount)
        ? { ...state, currentStep: Math.max(0, state.currentStep - 1) }
        : state;
    case 'next':
      return state.phase === 'training' && validStepCount(action.stepCount)
        ? withNextStep(state, action.stepCount)
        : state;
    case 'recordSuccess':
      return state.phase === 'training' && !state.resetSuggested
        ? {
            ...state,
            successfulRepetitions: state.successfulRepetitions + 1,
            consecutiveChallenges: 0,
          }
        : state;
    case 'recordChallenge': {
      if (state.phase !== 'training' || state.resetSuggested) return state;
      const consecutiveChallenges = state.consecutiveChallenges + 1;
      const resetSuggested = consecutiveChallenges >= 2;
      return {
        ...state,
        needsHelpRepetitions: state.needsHelpRepetitions + 1,
        consecutiveChallenges,
        resetSuggested,
        running: resetSuggested ? false : state.running,
      };
    }
    case 'acceptReset':
      return state.phase === 'training' && state.resetSuggested
        ? {
            ...state,
            consecutiveChallenges: 0,
            resetSuggested: false,
            running: state.remainingSeconds > 0,
          }
        : state;
    case 'finish':
      return state.phase === 'training'
        ? { ...state, phase: 'feedback', running: false, selectedRating: null }
        : state;
    case 'returnToTraining':
      return state.phase === 'feedback'
        ? {
            ...state,
            phase: 'training',
            running: state.remainingSeconds > 0 && !state.resetSuggested,
            selectedRating: null,
          }
        : state;
    case 'selectRating':
      return state.phase === 'feedback' && isRating(action.rating)
        ? { ...state, selectedRating: action.rating }
        : state;
    case 'submit':
      return state.phase === 'feedback' && state.selectedRating !== null
        ? { ...state, phase: 'saving', running: false }
        : state;
    case 'saveSucceeded':
      return state.phase === 'saving'
        ? { ...state, phase: 'complete', running: false }
        : state;
    case 'saveFailed':
      return state.phase === 'saving'
        ? { ...state, phase: 'feedback', running: false }
        : state;
    case 'cancel':
      return state.phase === 'prepare' || state.phase === 'training' || state.phase === 'feedback'
        ? { ...state, phase: 'cancelled', running: false }
        : state;
  }
}

export function sessionCheckInMessage(state: GuidedSessionState): string {
  if (state.resetSuggested) {
    return 'Two attempts felt difficult in a row. Pause, make the setup easier, then continue when both of you are ready.';
  }
  if (state.successfulRepetitions === 0 && state.needsHelpRepetitions === 0) {
    return 'After each attempt, record what happened. Small, relaxed wins count.';
  }
  if (state.consecutiveChallenges === 1) {
    return 'Good noticing. Make the next repetition easier before trying again.';
  }
  if (state.successfulRepetitions >= 3 && state.needsHelpRepetitions === 0) {
    return 'A lovely run of easy wins. Consider finishing while confidence is high.';
  }
  return `${state.successfulRepetitions} successful ${pluralise(state.successfulRepetitions, 'repetition')} and ${state.needsHelpRepetitions} ${pluralise(state.needsHelpRepetitions, 'attempt')} needing help so far.`;
}

export function suggestedSessionRating(
  state: GuidedSessionState,
): 2 | 3 | 5 | null {
  const total = state.successfulRepetitions + state.needsHelpRepetitions;
  if (total === 0) return null;
  if (
    state.needsHelpRepetitions >= 2
    && state.successfulRepetitions <= state.needsHelpRepetitions
  ) {
    return 2;
  }
  if (
    state.successfulRepetitions >= 4
    && state.successfulRepetitions >= state.needsHelpRepetitions * 3
  ) {
    return 5;
  }
  return 3;
}

export function createGuidedSessionNote(
  state: GuidedSessionState,
  stepCount: number,
): string {
  return `Guided check-ins: ${state.successfulRepetitions} successful ${pluralise(state.successfulRepetitions, 'repetition')}; ${state.needsHelpRepetitions} ${pluralise(state.needsHelpRepetitions, 'attempt')} needed help. Reached step ${state.furthestStep + 1} of ${Math.max(1, stepCount)}.`;
}

export function formatSessionTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const minutes = Math.floor(safeSeconds / 60);
  return `${minutes}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

function withNextStep(
  state: GuidedSessionState,
  stepCount: number,
): GuidedSessionState {
  const currentStep = Math.min(stepCount - 1, state.currentStep + 1);
  return {
    ...state,
    currentStep,
    furthestStep: Math.max(state.furthestStep, currentStep),
  };
}

function validStepCount(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function isRating(value: number): value is LessonPerformanceRating {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

function isIsoTimestamp(value: string): boolean {
  return value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

function pluralise(value: number, singular: string): string {
  return value === 1 ? singular : `${singular}s`;
}
