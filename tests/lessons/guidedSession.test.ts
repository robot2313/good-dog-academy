import {
  createGuidedSessionNote,
  createGuidedSessionState,
  formatSessionTime,
  guidedSessionReducer,
  sessionCheckInMessage,
  suggestedSessionRating,
} from '../../src/features/lessons/session/guidedSession';

const startedAt = '2026-07-23T03:00:00.000Z';

describe('guided training session state', () => {
  it('prepares a stable session and records the actual start time', () => {
    const prepared = createGuidedSessionState(6, 'session-1');
    expect(prepared).toMatchObject({
      phase: 'prepare',
      sessionId: 'session-1',
      startedAt: null,
      currentStep: 0,
      remainingSeconds: 360,
      running: false,
      selectedRating: null,
    });

    expect(guidedSessionReducer(prepared, { type: 'begin', startedAt })).toMatchObject({
      phase: 'training',
      startedAt,
      running: true,
    });
    expect(() => createGuidedSessionState(5, ' ')).toThrow(RangeError);
  });

  it('rejects invalid or repeated begin actions', () => {
    const prepared = createGuidedSessionState(5, 'session-1');
    expect(guidedSessionReducer(prepared, { type: 'begin', startedAt: 'invalid' })).toBe(prepared);
    const running = guidedSessionReducer(prepared, { type: 'begin', startedAt });
    expect(guidedSessionReducer(running, { type: 'begin', startedAt })).toBe(running);
  });

  it('counts down only while running and stops safely at zero', () => {
    const running = {
      ...guidedSessionReducer(createGuidedSessionState(1, 'session-1'), {
        type: 'begin',
        startedAt,
      }),
      remainingSeconds: 1,
    };
    const expired = guidedSessionReducer(running, { type: 'tick' });

    expect(expired).toMatchObject({ remainingSeconds: 0, running: false });
    expect(guidedSessionReducer(expired, { type: 'tick' })).toBe(expired);
    expect(guidedSessionReducer(expired, { type: 'resume' })).toBe(expired);
  });

  it('pauses and resumes without changing the time', () => {
    const running = guidedSessionReducer(createGuidedSessionState(5, 'session-1'), {
      type: 'begin',
      startedAt,
    });
    const paused = guidedSessionReducer(running, { type: 'pause' });
    expect(guidedSessionReducer(paused, { type: 'tick' }).remainingSeconds).toBe(300);
    expect(guidedSessionReducer(paused, { type: 'resume' }).running).toBe(true);
  });

  it('keeps step navigation inside valid bounds and rejects invalid counts', () => {
    const running = guidedSessionReducer(createGuidedSessionState(5, 'session-1'), {
      type: 'begin',
      startedAt,
    });
    expect(guidedSessionReducer(running, { type: 'previous', stepCount: 3 }).currentStep).toBe(0);
    const second = guidedSessionReducer(running, { type: 'next', stepCount: 3 });
    const third = guidedSessionReducer(second, { type: 'next', stepCount: 3 });
    expect(guidedSessionReducer(third, { type: 'next', stepCount: 3 }).currentStep).toBe(2);
    expect(guidedSessionReducer(third, { type: 'next', stepCount: 0 })).toBe(third);
  });

  it('records check-ins and requires a reset after two difficult attempts', () => {
    const running = guidedSessionReducer(createGuidedSessionState(5, 'session-1'), {
      type: 'begin',
      startedAt,
    });
    const success = guidedSessionReducer(running, { type: 'recordSuccess' });
    const first = guidedSessionReducer(success, { type: 'recordChallenge' });
    const second = guidedSessionReducer(first, { type: 'recordChallenge' });

    expect(second).toMatchObject({
      successfulRepetitions: 1,
      needsHelpRepetitions: 2,
      consecutiveChallenges: 2,
      resetSuggested: true,
      running: false,
    });
    expect(sessionCheckInMessage(second)).toContain('make the setup easier');
    expect(guidedSessionReducer(second, { type: 'recordSuccess' })).toBe(second);
    expect(guidedSessionReducer(second, { type: 'acceptReset' })).toMatchObject({
      resetSuggested: false,
      consecutiveChallenges: 0,
      running: true,
    });
  });

  it('requires feedback and a rating before entering the saving phase', () => {
    const running = guidedSessionReducer(createGuidedSessionState(5, 'session-1'), {
      type: 'begin',
      startedAt,
    });
    expect(guidedSessionReducer(running, { type: 'selectRating', rating: 4 })).toBe(running);
    const feedback = guidedSessionReducer(running, { type: 'finish' });
    expect(guidedSessionReducer(feedback, { type: 'submit' })).toBe(feedback);
    const rated = guidedSessionReducer(feedback, { type: 'selectRating', rating: 4 });
    expect(rated.selectedRating).toBe(4);
    expect(guidedSessionReducer(rated, { type: 'submit' }).phase).toBe('saving');
  });

  it('does not complete until saving succeeds and preserves the rating on failure', () => {
    const running = guidedSessionReducer(createGuidedSessionState(5, 'session-1'), {
      type: 'begin',
      startedAt,
    });
    const feedback = guidedSessionReducer(running, { type: 'finish' });
    const rated = guidedSessionReducer(feedback, { type: 'selectRating', rating: 5 });
    const saving = guidedSessionReducer(rated, { type: 'submit' });
    expect(guidedSessionReducer(saving, { type: 'submit' })).toBe(saving);
    expect(guidedSessionReducer(saving, { type: 'saveFailed' })).toMatchObject({
      phase: 'feedback',
      selectedRating: 5,
    });
    expect(guidedSessionReducer(saving, { type: 'saveSucceeded' }).phase).toBe('complete');
  });

  it('cancels without allowing terminal or saving states to change', () => {
    const running = guidedSessionReducer(createGuidedSessionState(5, 'session-1'), {
      type: 'begin',
      startedAt,
    });
    const cancelled = guidedSessionReducer(running, { type: 'cancel' });
    expect(cancelled).toMatchObject({ phase: 'cancelled', running: false });
    expect(guidedSessionReducer(cancelled, { type: 'finish' })).toBe(cancelled);

    const saving = guidedSessionReducer(
      guidedSessionReducer(
        guidedSessionReducer(running, { type: 'finish' }),
        { type: 'selectRating', rating: 3 },
      ),
      { type: 'submit' },
    );
    expect(guidedSessionReducer(saving, { type: 'cancel' })).toBe(saving);
  });

  it('suggests but never chooses a rating and creates a concise note', () => {
    let state = guidedSessionReducer(createGuidedSessionState(5, 'session-1'), {
      type: 'begin',
      startedAt,
    });
    expect(suggestedSessionRating(state)).toBeNull();
    for (let index = 0; index < 4; index += 1) {
      state = guidedSessionReducer(state, { type: 'recordSuccess' });
    }
    state = guidedSessionReducer(state, { type: 'next', stepCount: 4 });
    expect(suggestedSessionRating(state)).toBe(5);
    expect(state.selectedRating).toBeNull();
    expect(createGuidedSessionNote(state, 4)).toBe(
      'Guided check-ins: 4 successful repetitions; 0 attempts needed help. Reached step 2 of 4.',
    );
  });

  it('formats a stable non-negative timer', () => {
    expect(formatSessionTime(360)).toBe('6:00');
    expect(formatSessionTime(59)).toBe('0:59');
    expect(formatSessionTime(-4)).toBe('0:00');
    expect(formatSessionTime(Number.NaN)).toBe('0:00');
  });
});
