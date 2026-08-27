import { fireEvent, render } from '@testing-library/react-native';

import type { LessonDefinition, LessonPerformanceRating } from '../../src/domain/models';
import {
  createGuidedSessionState,
  guidedSessionReducer,
  type GuidedSessionState,
} from '../../src/features/lessons/session/guidedSession';
import { LessonSessionScreenView } from '../../src/features/lessons/session/LessonSessionScreenView';

const startedAt = '2026-07-23T03:00:00.000Z';

const richLesson: LessonDefinition = {
  id: 'test-rich-lesson',
  contentVersion: 1,
  title: 'Rich Test Lesson',
  shortDescription: 'A deterministic lesson for the guided-session view.',
  skill: 'focus',
  category: 'foundation',
  difficultyLevel: 1,
  estimatedMinutes: 5,
  goal: 'Build a calm voluntary check-in.',
  equipment: ['Small treats'],
  prerequisites: [],
  minimumDogAgeMonths: null,
  steps: [
    '1. Stand near your dog with rewards ready.',
    '2. Wait quietly without prompting.',
    '3. Mark the moment they look at you.',
    '4. Reward beside your leg.',
    '5. Repeat five times and finish keen.',
  ],
  tips: ['Keep sessions under a minute.', 'Accept a brief glance.'],
  commonMistakes: ['Calling the dog repeatedly to make them look.'],
  troubleshooting: [
    { problem: 'No check-in happens.', solution: 'Move to a quieter space and mark a small head turn.' },
  ],
  safetyNotes: ['Keep the exercise short and optional.'],
  completionCriteria: { description: 'Five voluntary check-ins in two minutes.', minimumSuccessfulCompletions: 5, minimumPerformanceRating: null },
  tags: ['focus'],
  isActive: true,
};

describe('Lesson Session — Before You Begin', () => {
  it('gathers the lesson overview, coaching tips, troubleshooting and easier options', () => {
    const props = screenProps(createGuidedSessionState(5, 'session-1'));
    const view = render(<LessonSessionScreenView {...props} />);

    expect(view.getByRole('header', { name: 'Before You Begin' })).toBeTruthy();
    expect(view.getByText('Build a calm voluntary check-in.')).toBeTruthy();
    expect(view.getByRole('header', { name: 'Coaching tips' })).toBeTruthy();
    expect(view.getByText('Keep sessions under a minute.')).toBeTruthy();
    expect(view.getByRole('header', { name: 'Things that might go wrong' })).toBeTruthy();
    expect(view.getByText('No check-in happens.')).toBeTruthy();
    expect(view.getByText('Calling the dog repeatedly to make them look.')).toBeTruthy();
    expect(view.getByRole('header', { name: 'Make it easier' })).toBeTruthy();
    expect(view.getByText('Move to a quieter space and mark a small head turn.')).toBeTruthy();

    fireEvent.press(view.getByRole('button', { name: 'Start Lesson' }));
    expect(props.onBegin).toHaveBeenCalledTimes(1);
  });
});

describe('Lesson Session — single active-session screen', () => {
  it('shows the timer, all five steps at once, counters, undo and finish actions', () => {
    const props = screenProps(runningState());
    const view = render(<LessonSessionScreenView {...props} />);

    // Compact timer header with pause control.
    expect(view.getByText('SESSION RUNNING')).toBeTruthy();
    expect(view.getByText('5:00')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Pause session timer' }));
    expect(props.onPause).toHaveBeenCalledTimes(1);

    // All five steps render simultaneously.
    expect(view.getByText('Stand near your dog with rewards ready.')).toBeTruthy();
    expect(view.getByText('Wait quietly without prompting.')).toBeTruthy();
    expect(view.getByText('Mark the moment they look at you.')).toBeTruthy();
    expect(view.getByText('Reward beside your leg.')).toBeTruthy();
    expect(view.getByText('Repeat five times and finish keen.')).toBeTruthy();

    // No per-step page navigation and no active-session photograph.
    expect(view.queryByRole('button', { name: 'Previous training step' })).toBeNull();
    expect(view.queryByRole('button', { name: 'Next training step' })).toBeNull();
    expect(view.queryByRole('progressbar')).toBeNull();
    expect(view.queryByRole('image')).toBeNull();

    // Counters use the Success / Try Again wording.
    expect(view.getByText('SUCCESS')).toBeTruthy();
    expect(view.getByText('TRY AGAIN')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: /Mark a successful repetition/ }));
    fireEvent.press(view.getByRole('button', { name: /Mark a repetition that needs help/ }));
    expect(props.onRecordSuccess).toHaveBeenCalledTimes(1);
    expect(props.onRecordChallenge).toHaveBeenCalledTimes(1);

    fireEvent.press(view.getByRole('button', { name: 'Complete Lesson' }));
    fireEvent.press(view.getByRole('button', { name: 'Back' }));
    expect(props.onFinish).toHaveBeenCalledTimes(1);
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables Undo until a check-in exists, then reverses the latest tap', () => {
    const idle = screenProps(runningState());
    const idleView = render(<LessonSessionScreenView {...idle} />);
    expect(idleView.getByRole('button', { name: 'Undo last check-in' }).props.accessibilityState)
      .toEqual({ disabled: true });

    const afterSuccess = guidedSessionReducer(runningState(), { type: 'recordSuccess' });
    const props = screenProps(afterSuccess);
    const view = render(<LessonSessionScreenView {...props} />);
    const undo = view.getByRole('button', { name: 'Undo last check-in' });
    expect(undo.props.accessibilityState).toEqual({ disabled: false });
    fireEvent.press(undo);
    expect(props.onUndo).toHaveBeenCalledTimes(1);
  });
});

describe('Lesson Session — rating and completion (unchanged flow)', () => {
  it('offers all five ratings and prevents saving until one is selected', () => {
    const feedback = guidedSessionReducer(runningState(), { type: 'finish' });
    const props = screenProps(feedback);
    const view = render(<LessonSessionScreenView {...props} />);

    expect(view.getAllByRole('button', { name: /out of 5/ })).toHaveLength(5);
    expect(view.getByRole('button', { name: 'Save session' }).props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(view.getByRole('button', { name: /^4 out of 5/ }));
    expect(props.onSelectRating).toHaveBeenCalledWith(4);

    const rated = guidedSessionReducer(feedback, { type: 'selectRating', rating: 4 });
    const ratedProps = screenProps(rated);
    view.rerender(<LessonSessionScreenView {...ratedProps} />);
    expect(view.getByRole('button', { name: 'Save session' }).props.accessibilityState).toEqual({ disabled: false });
    fireEvent.press(view.getByRole('button', { name: 'Save session' }));
    expect(ratedProps.onSave).toHaveBeenCalledTimes(1);
  });

  it('shows a saved snapshot and returns to the lesson', () => {
    const feedback = guidedSessionReducer(runningState(), { type: 'finish' });
    const rated = guidedSessionReducer(feedback, { type: 'selectRating', rating: 5 });
    const saving = guidedSessionReducer(rated, { type: 'submit' });
    const complete = guidedSessionReducer(saving, { type: 'saveSucceeded' });
    const props = screenProps(complete);
    const view = render(<LessonSessionScreenView {...props} />);

    expect(view.getByText('SESSION SAVED')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Back to lesson' }));
    expect(props.onDone).toHaveBeenCalledTimes(1);
  });
});

function runningState(): GuidedSessionState {
  return guidedSessionReducer(createGuidedSessionState(5, 'session-1'), {
    type: 'begin',
    startedAt,
  });
}

function screenProps(state: GuidedSessionState, saveError: string | null = null) {
  return {
    lesson: richLesson,
    dogName: 'Scout',
    state,
    saveError,
    onBegin: jest.fn(),
    onPause: jest.fn(),
    onResume: jest.fn(),
    onRecordSuccess: jest.fn(),
    onRecordChallenge: jest.fn(),
    onUndo: jest.fn(),
    onAcceptReset: jest.fn(),
    onFinish: jest.fn(),
    onReturnToTraining: jest.fn(),
    onSelectRating: jest.fn<void, [LessonPerformanceRating]>(),
    onSave: jest.fn(),
    onCancel: jest.fn(),
    onDone: jest.fn(),
  };
}
