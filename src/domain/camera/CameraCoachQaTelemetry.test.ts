import { CameraCoachQaTelemetry } from './CameraCoachQaTelemetry';

describe('CameraCoachQaTelemetry', () => {
  it('counts camera, voice, confirmation and pause signals without storing media', () => {
    const telemetry = new CameraCoachQaTelemetry();
    telemetry.record('session_started', null, '2026-09-13T00:00:00.000Z');
    telemetry.record('frame_captured', 'frame-1', '2026-09-13T00:00:01.000Z');
    telemetry.record('frame_analysed', 'frame-1', '2026-09-13T00:00:01.200Z');
    telemetry.record('owner_confirmation_requested', 'low_confidence', '2026-09-13T00:00:02.000Z');
    telemetry.record('voice_command', 'pause', '2026-09-13T00:00:03.000Z');
    telemetry.record('session_paused', null, '2026-09-13T00:00:03.100Z');
    telemetry.record('rep_cancelled_for_pause', null, '2026-09-13T00:00:03.200Z');
    telemetry.record('session_resumed', null, '2026-09-13T00:00:05.000Z');

    expect(telemetry.getSnapshot()).toMatchObject({
      startedAt: '2026-09-13T00:00:00.000Z',
      framesCaptured: 1,
      framesAnalysed: 1,
      ownerConfirmationsRequested: 1,
      voiceCommands: 1,
      pauses: 1,
      resumes: 1,
      repsCancelledForPause: 1,
      saveFailures: 0,
    });
  });

  it('keeps only the most recent 20 QA events', () => {
    const telemetry = new CameraCoachQaTelemetry();
    for (let index = 0; index < 25; index += 1) {
      telemetry.record('voice_unclear', `event-${index}`, `2026-09-13T00:00:${String(index).padStart(2, '0')}.000Z`);
    }

    const snapshot = telemetry.getSnapshot();
    expect(snapshot.unclearVoiceResults).toBe(25);
    expect(snapshot.recentEvents).toHaveLength(20);
    expect(snapshot.recentEvents[0]?.detail).toBe('event-5');
    expect(snapshot.recentEvents[19]?.detail).toBe('event-24');
  });

  it('resets between real-device QA sessions', () => {
    const telemetry = new CameraCoachQaTelemetry();
    telemetry.record('save_failed');
    telemetry.reset();

    expect(telemetry.getSnapshot()).toEqual({
      startedAt: null,
      lastEventAt: null,
      framesCaptured: 0,
      framesAnalysed: 0,
      ownerConfirmationsRequested: 0,
      ownerConfirmationsRecorded: 0,
      automaticRepsRecorded: 0,
      voiceCommands: 0,
      unclearVoiceResults: 0,
      voiceErrors: 0,
      pauses: 0,
      resumes: 0,
      repsCancelledForPause: 0,
      saveFailures: 0,
      recentEvents: [],
    });
  });
});
