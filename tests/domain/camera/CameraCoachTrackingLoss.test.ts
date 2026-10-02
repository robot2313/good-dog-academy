import {
  CameraCoachOrchestrator,
} from '../../../src/domain/camera/CameraCoachOrchestrator';
import {
  createLiveCoachSession,
} from '../../../src/domain/behaviour/LiveCoachEngine';
import type {
  CameraFrame,
} from '../../../src/services/camera/CameraFrameSource';
import type {
  DogVisionEngine,
  DogVisionResult,
} from '../../../src/services/vision/DogVisionEngine';
import type {
  CameraRepObservation,
} from '../../../src/domain/camera/cameraEvidence';

function frame(id: string, capturedAt: string): CameraFrame {
  return {
    id,
    capturedAt,
    uri: `file://${id}.jpg`,
    width: 640,
    height: 480,
    rotationDegrees: 0,
  };
}

function vision(overrides: Partial<DogVisionResult> = {}): DogVisionResult {
  return {
    frameId: 'vision-frame',
    analysedAt: '2026-09-12T10:00:01.000Z',
    dogDetected: true,
    detectionConfidence: 0.95,
    dogBoundingBox: {
      left: 0.2,
      top: 0.2,
      width: 0.6,
      height: 0.6,
    },
    detectionSource: 'dedicated_detector',
    trackingConfidence: 0.95,
    trackingState: 'tracking',
    posture: 'sit_like',
    postureConfidence: 0.95,
    stressSignal: 'none',
    stressConfidence: null,
    ...overrides,
  };
}

function observation(
  overrides: Partial<CameraRepObservation> = {},
): CameraRepObservation {
  return {
    outcome: 'partial-success',
    expectedPosture: null,
    responseWindowMs: null,
    observedAt: '2026-09-12T10:00:01.000Z',
    cueAt: null,
    responseAt: '2026-09-12T10:00:01.000Z',
    markerAt: null,
    rewardAt: null,
    cueCount: 1,
    signal: null,
    notes: 'tracking-loss QA',
    ...overrides,
  };
}

class SequenceVisionEngine implements DogVisionEngine {
  private index = 0;

  constructor(private readonly results: readonly DogVisionResult[]) {}

  async warmup(): Promise<void> {}

  async detect(input: CameraFrame): Promise<DogVisionResult> {
    const result =
      this.results[Math.min(this.index++, this.results.length - 1)];

    return {
      ...result,
      frameId: input.id,
    };
  }

  async dispose(): Promise<void> {}
}

describe('Camera Coach tracking-loss safety', () => {
  it('does not record a rep during tracking loss or immediately after reacquisition', async () => {
    const engine = new SequenceVisionEngine([
      vision(),
      vision({
        dogDetected: false,
        detectionConfidence: 0,
        dogBoundingBox: null,
        detectionSource: null,
        trackingConfidence: 0,
        trackingState: 'lost',
        posture: 'unknown',
        postureConfidence: null,
      }),
      vision(),
    ]);

    const orchestrator = new CameraCoachOrchestrator(
      createLiveCoachSession({
        id: 'session-tracking-loss',
        dogId: 'dog-1',
        lessonId: 'qa-camera-tracking-loss',
        targetReps: 5,
      }),
      engine,
      { minFrameIntervalMs: 0 },
    );

    const first = await orchestrator.processFrame(
      frame('tracking-before-loss', '2026-09-12T10:00:01.000Z'),
      observation({
        observedAt: '2026-09-12T10:00:01.000Z',
        responseAt: '2026-09-12T10:00:01.000Z',
      }),
    );

    const lost = await orchestrator.processFrame(
      frame('tracking-lost', '2026-09-12T10:00:02.000Z'),
      observation({
        observedAt: '2026-09-12T10:00:02.000Z',
        responseAt: '2026-09-12T10:00:02.000Z',
      }),
    );

    const reacquired = await orchestrator.processFrame(
      frame('tracking-reacquired', '2026-09-12T10:00:03.000Z'),
      observation({
        observedAt: '2026-09-12T10:00:03.000Z',
        responseAt: '2026-09-12T10:00:03.000Z',
      }),
    );

    expect(first.kind).toBe('waiting_for_temporal');
    expect(lost.kind).toBe('dog_not_in_view');
    expect(reacquired.kind).toBe('waiting_for_temporal');
    expect(orchestrator.getSession().reps).toHaveLength(0);
    expect(orchestrator.getPendingConfirmation()).toBeNull();
  });
});
