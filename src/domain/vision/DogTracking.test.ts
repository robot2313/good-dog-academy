import { DogTracker } from './DogTracking';

describe('DogTracker', () => {
  const detection = (left: number, top: number, width = 0.4, height = 0.4) => ({
    box: { left, top, width, height },
    confidence: 0.92,
    source: 'dedicated_detector' as const,
  });

  it('acquires and smooths a dog box', () => {
    const tracker = new DogTracker();
    const first = tracker.update(detection(0.20, 0.20), 0);
    const second = tracker.update(detection(0.40, 0.20), 100);

    expect(first.state).toBe('acquired');
    expect(second.state).toBe('tracking');
    expect(second.box?.left).toBeGreaterThan(0.20);
    expect(second.box?.left).toBeLessThan(0.40);
  });

  it('holds the last box through brief detection gaps', () => {
    const tracker = new DogTracker();
    tracker.update(detection(0.30, 0.30), 0);
    const miss = tracker.update(null, 500);

    expect(miss.state).toBe('temporarily_lost');
    expect(miss.box?.left).toBeCloseTo(0.30);
    expect(miss.trackingConfidence).toBeGreaterThan(0);
  });

  it('declares the dog lost after the grace period', () => {
    const tracker = new DogTracker({ lostAfterMs: 1000 });
    tracker.update(detection(0.30, 0.30), 0);
    const lost = tracker.update(null, 1101);

    expect(lost.state).toBe('lost');
    expect(lost.box).not.toBeNull();
  });

  it('reacquires without resetting the tracking object', () => {
    const tracker = new DogTracker({ lostAfterMs: 500 });
    tracker.update(detection(0.30, 0.30), 0);
    tracker.update(null, 700);
    const reacquired = tracker.update(detection(0.34, 0.32), 800);

    expect(reacquired.state).toBe('reacquiring');
    expect(reacquired.box?.left).toBeCloseTo(0.34);
  });
});

  it('selects the detection that overlaps the current target when multiple dogs are present', () => {
    const tracker = new DogTracker();
    tracker.update(detection(0.10, 0.20), 0);

    const otherDog = detection(0.65, 0.20);
    const matchingDog = detection(0.14, 0.22);
    const result = tracker.update([otherDog, matchingDog], 100);

    expect(result.state).toBe('tracking');
    expect(result.box?.left).toBeLessThan(0.30);
  });
