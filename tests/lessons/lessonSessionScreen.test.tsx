import { fireEvent, render } from '@testing-library/react-native';

import type { LessonPerformanceRating } from '../../src/domain/models';
import {
  createGuidedSessionState,
  guidedSessionReducer,
  type GuidedSessionState,
} from '../../src/features/lessons/session/guidedSession';
import { LessonSessionScreenView } from '../../src/features/lessons/session/LessonSessionScreenView';
import { foundationLesson } from '../support/lessonFixtures';

const startedAt = '2026-07-23T03:00:00.000Z';

describe('Lesson Session screen', () => {
  it('shows the Phase 1 illustration, preparation guidance, and explicit start action', () => {
    const props = screenProps(createGuidedSessionState(5, 'session-1'));
    const view = render(<LessonSessionScreenView {...props} />);

    expect(view.getByText('GUIDED SESSION')).toBeTruthy();
    expect(view.getByText(foundationLesson.goal)).toBeTruthy();
    expect(view.getByRole('image', { name: /Focus training illustration/ })).toBeTruthy();
    expect(view.getByRole('button', { name: 'Begin 5-minute session' })).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Begin 5-minute session' }));
    expect(props.onBegin).toHaveBeenCalledTimes(1);
  });

  it('shows bounded step controls, coaching check-ins, and cancellation while training', () => {
    const state = runningState();
    const props = screenProps(state);
    const view = render(<LessonSessionScreenView {...props} />);

    expect(view.getByRole('progressbar').props.accessibilityValue).toEqual({ min: 0, max: 1, now: 1 });
    expect(view.getByText('5:00')).toBeTruthy();
    expect(view.getByRole('button', { name: 'Previous training step' }).props.accessibilityState).toEqual({ disabled: true });
    expect(view.getByRole('button', { name: 'Next training step' }).props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(view.getByRole('button', { name: 'Mark a successful repetition' }));
    fireEvent.press(view.getByRole('button', { name: 'Mark a repetition that needs help' }));
    fireEvent.press(view.getByRole('button', { name: 'Finish and rate session' }));
    fireEvent.press(view.getByRole('button', { name: 'Leave without saving' }));
    expect(props.onRecordSuccess).toHaveBeenCalledTimes(1);
    expect(props.onRecordChallenge).toHaveBeenCalledTimes(1);
    expect(props.onFinish).toHaveBeenCalledTimes(1);
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

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

  it('locks controls while saving and presents a retryable error after failure', () => {
    const feedback = guidedSessionReducer(runningState(), { type: 'finish' });
    const rated = guidedSessionReducer(feedback, { type: 'selectRating', rating: 3 });
    const saving = guidedSessionReducer(rated, { type: 'submit' });
    const props = screenProps(saving, 'The session could not be saved.');
    const view = render(<LessonSessionScreenView {...props} />);

    expect(view.getByRole('button', { name: 'Saving session' }).props.accessibilityState).toEqual({ disabled: true });
    expect(view.queryByRole('button', { name: 'Leave without saving' })).toBeNull();
    expect(view.getByText('The session could not be saved.')).toBeTruthy();
  });

  it('shows a saved snapshot and returns to the existing lesson summary', () => {
    const feedback = guidedSessionReducer(runningState(), { type: 'finish' });
    const rated = guidedSessionReducer(feedback, { type: 'selectRating', rating: 5 });
    const saving = guidedSessionReducer(rated, { type: 'submit' });
    const complete = guidedSessionReducer(saving, { type: 'saveSucceeded' });
    const props = screenProps(complete);
    const view = render(<LessonSessionScreenView {...props} />);

    expect(view.getByText('SESSION SAVED')).toBeTruthy();
    expect(view.getByRole('header', { name: 'That practice counts.' })).toBeTruthy();
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
    lesson: foundationLesson,
    dogName: 'Scout',
    state,
    saveError,
    onBegin: jest.fn(),
    onPause: jest.fn(),
    onResume: jest.fn(),
    onPrevious: jest.fn(),
    onNext: jest.fn(),
    onRecordSuccess: jest.fn(),
    onRecordChallenge: jest.fn(),
    onAcceptReset: jest.fn(),
    onFinish: jest.fn(),
    onReturnToTraining: jest.fn(),
    onSelectRating: jest.fn<void, [LessonPerformanceRating]>(),
    onSave: jest.fn(),
    onCancel: jest.fn(),
    onDone: jest.fn(),
  };
}
