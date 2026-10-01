import { liveVisionStatus } from '../../src/domain/vision/CameraCoachStatus';
import type { SmartFramingResult } from '../../src/domain/vision/SmartFraming';

const ready: SmartFramingResult = {
  status: 'good',
  instruction: 'Good — your dog is ready.',
  ready: true,
};

const notReady: SmartFramingResult = {
  status: 'move-camera-left',
  instruction: 'Move the camera left.',
  ready: false,
};

describe('liveVisionStatus', () => {
  it('shows the initial watching state', () => {
    expect(liveVisionStatus(null, null)).toBe('Watching for your dog…');
  });

  it('shows looking for your dog when no dog is detected', () => {
    expect(
      liveVisionStatus(
        {
          dogDetected: false,
          posture: 'unknown',
          postureConfidence: null,
        },
        notReady,
      ),
    ).toBe('Looking for your dog');
  });

  it('does not call unknown posture "checking position"', () => {
    expect(
      liveVisionStatus(
        {
          dogDetected: true,
          posture: 'unknown',
          postureConfidence: null,
        },
        notReady,
      ),
    ).toBe('Dog detected');
  });

  it('shows dog in position when framing is ready but posture is unknown', () => {
    expect(
      liveVisionStatus(
        {
          dogDetected: true,
          posture: 'unknown',
          postureConfidence: null,
        },
        ready,
      ),
    ).toBe('Dog in position');
  });

  it('preserves recognised posture statuses when framing is ready', () => {
    expect(
      liveVisionStatus(
        {
          dogDetected: true,
          posture: 'sit_like',
          postureConfidence: 0.9,
        },
        ready,
      ),
    ).toBe('Sit detected');

    expect(
      liveVisionStatus(
        {
          dogDetected: true,
          posture: 'stand_like',
          postureConfidence: 0.9,
        },
        ready,
      ),
    ).toBe('Stand detected');

    expect(
      liveVisionStatus(
        {
          dogDetected: true,
          posture: 'down_like',
          postureConfidence: 0.9,
        },
        ready,
      ),
    ).toBe('Down detected');
  });
});
