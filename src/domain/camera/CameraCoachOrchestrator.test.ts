import { createLiveCoachSession } from '../behaviour/LiveCoachEngine';
import type { CameraFrame } from '../../services/camera/CameraFrameSource';
import type { DogVisionEngine, DogVisionResult } from '../../services/vision/DogVisionEngine';
import { CameraCoachOrchestrator } from './CameraCoachOrchestrator';
import type { CameraRepObservation } from './cameraEvidence';

function frame(id: string, capturedAt: string): CameraFrame {
  return {
    id,
    capturedAt,
    width: 1280,
    height: 720,
    rotationDegrees: 0,
    uri: null,
  };
}

function observation(overrides: Partial<CameraRepObservation> = {}): CameraRepObservation {
  return {
    outcome: 'success',
    observedAt: '2026-09-12T10:00:01.000Z',
    cueAt: '2026-09-12T10:00:00.000Z',
    responseAt: '2026-09-12T10:00:01.000Z',
    markerAt: null,
    rewardAt: null,
    cueCount: 1,
    signal: null,
    notes: null,
    ...overrides,
  };
}

class FakeVisionEngine implements DogVisionEngine {
  detections = 0;

  constructor(private readonly result: DogVisionResult) {}

  async warmup(): Promise<void> {}

  async detect(input: CameraFrame): Promise<DogVisionResult> {
    this.detections += 1;
    return { ...this.result, frameId: input.id };
  }

  async dispose(): Promise<void> {}
}

function vision(overrides: Partial<DogVisionResult> = {}): DogVisionResult {
  return {
    frameId: 'frame-1',
    analysedAt: '2026-09-12T10:00:01.000Z',
    dogDetected: true,
    detectionConfidence: 0.94,
    posture: 'sit_like',
    postureConfidence: 0.91,
    stressSignal: 'none',
    stressConfidence: null,
    ...overrides,
  };
}

describe('CameraCoachOrchestrator', () => {
  it('records high-confidence camera evidence and returns the applied director decision', async () => {
    const engine = new FakeVisionEngine(vision());
    const orchestrator = new CameraCoachOrchestrator(
      createLiveCoachSession({ id: 'session-1', dogId: 'dog-1', lessonId: 'sit', targetReps: 5 }),
      engine,
      { makeRepId: (repNumber) => `rep-${repNumber}` },
    );

    const result = await orchestrator.processFrame(
      frame('frame-1', '2026-09-12T10:00:01.000Z'),
      observation(),
    );

    expect(result.kind).toBe('rep_recorded');
    if (result.kind !== 'rep_recorded') return;
    expect(result.rep.id).toBe('rep-1');
    expect(result.rep.evidence.source).toBe('camera_auto');
    expect(result.session.reps).toHaveLength(1);
    expect(result.decision.action).toBe('hold');
  });

  it('throttles frames inside the configured analysis interval', async () => {
    const engine = new FakeVisionEngine(vision());
    const orchestrator = new CameraCoachOrchestrator(
      createLiveCoachSession({ id: 'session-2', dogId: 'dog-1', lessonId: 'sit' }),
      engine,
      { minFrameIntervalMs: 500 },
    );

    await orchestrator.processFrame(frame('a', '2026-09-12T10:00:01.000Z'), observation());
    const second = await orchestrator.processFrame(frame('b', '2026-09-12T10:00:01.200Z'), observation());

    expect(second.kind).toBe('throttled');
    expect(engine.detections).toBe(1);
  });

  it('does not mutate the session when camera confidence is too low', async () => {
    const engine = new FakeVisionEngine(vision({ postureConfidence: 0.3 }));
    const orchestrator = new CameraCoachOrchestrator(
      createLiveCoachSession({ id: 'session-3', dogId: 'dog-1', lessonId: 'sit' }),
      engine,
    );

    const result = await orchestrator.processFrame(
      frame('frame-low', '2026-09-12T10:00:01.000Z'),
      observation(),
    );

    expect(result.kind).toBe('owner_confirmation');
    expect(orchestrator.getSession().reps).toHaveLength(0);
    expect(orchestrator.getPendingConfirmation()?.reason).toBe('low_posture_confidence');
  });

  it('turns an owner-confirmed stress observation into a safety break decision', async () => {
    const engine = new FakeVisionEngine(vision({ stressSignal: 'avoidance_like', stressConfidence: 0.88 }));
    const orchestrator = new CameraCoachOrchestrator(
      createLiveCoachSession({
        id: 'session-4',
        dogId: 'dog-1',
        lessonId: 'sit',
        targetReps: 5,
        startDifficulty: { distance: 2, duration: 2, distraction: 2 },
      }),
      engine,
    );

    const automatic = await orchestrator.processFrame(
      frame('stress-frame', '2026-09-12T10:00:01.000Z'),
      observation(),
    );
    expect(automatic.kind).toBe('owner_confirmation');
    expect(orchestrator.getSession().reps).toHaveLength(0);

    const confirmed = orchestrator.confirmPendingByOwner('success', '2026-09-12T10:00:02.000Z');
    expect(confirmed.kind).toBe('rep_recorded');
    if (confirmed.kind !== 'rep_recorded') return;
    expect(confirmed.rep.evidence.source).toBe('owner_confirmed');
    expect(confirmed.rep.evidence.signal).toContain('stress:avoidance_like');
    expect(confirmed.decision.action).toBe('break');
    expect(confirmed.session.difficulty.distraction).toBe(1);
  });
});
