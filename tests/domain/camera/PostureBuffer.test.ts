import { describe, expect, it } from '@jest/globals';
import { PostureBuffer } from '../../../src/domain/camera/PostureBuffer';

function push(
  buffer: PostureBuffer,
  posture: 'stand_like' | 'sit_like' | 'down_like' | 'unknown',
  confidence: number | null = 0.9,
) {
  return buffer.push({ posture, confidence });
}

describe('PostureBuffer', () => {
  it('commits a stable posture after sufficient consensus', () => {
    const buffer = new PostureBuffer();

    push(buffer, 'sit_like');
    push(buffer, 'sit_like');

    expect(push(buffer, 'sit_like').stablePosture).toBe('sit_like');
  });

  it('does not establish a posture from a single observation', () => {
    const buffer = new PostureBuffer();

    expect(push(buffer, 'sit_like').stablePosture).toBeNull();
  });

  it('ignores unknown and low-confidence observations', () => {
    const buffer = new PostureBuffer();

    push(buffer, 'sit_like', 0.9);
    push(buffer, 'unknown');
    push(buffer, 'stand_like', 0.5);
    push(buffer, 'sit_like', 0.9);

    expect(push(buffer, 'sit_like', 0.9).stablePosture).toBe('sit_like');
  });

  it('uses 60 percent consensus across a mixed five-frame window', () => {
    const buffer = new PostureBuffer({ windowSize: 5 });

    push(buffer, 'sit_like');
    push(buffer, 'stand_like');
    push(buffer, 'sit_like');
    push(buffer, 'down_like');

    const result = push(buffer, 'sit_like');

    expect(result.stablePosture).toBe('sit_like');
  });

  it('does not switch on an unstable mixed window', () => {
    const buffer = new PostureBuffer({ windowSize: 5 });

    push(buffer, 'sit_like');
    push(buffer, 'sit_like');
    push(buffer, 'sit_like');

    expect(push(buffer, 'stand_like').stablePosture).toBe('sit_like');
    expect(push(buffer, 'stand_like').stablePosture).toBe('sit_like');
  });

  it('does not transition from low-confidence observations', () => {
    const buffer = new PostureBuffer({ windowSize: 5 });

    push(buffer, 'stand_like');
    push(buffer, 'stand_like');
    push(buffer, 'stand_like');

    push(buffer, 'sit_like', 0.5);
    push(buffer, 'sit_like', 0.5);
    const result = push(buffer, 'sit_like', 0.5);

    expect(result.stablePosture).toBe('stand_like');
    expect(result.transition).toBeNull();
  });

  it('reports a transition once a new posture reaches consensus', () => {
    const buffer = new PostureBuffer({ windowSize: 5 });

    push(buffer, 'stand_like');
    push(buffer, 'stand_like');
    push(buffer, 'stand_like');

    push(buffer, 'sit_like');
    expect(push(buffer, 'sit_like').transition).toBeNull();

    const result = push(buffer, 'sit_like');

    expect(result.stablePosture).toBe('sit_like');
    expect(result.transition).toEqual({
      from: 'stand_like',
      to: 'sit_like',
    });
  });

  it('does not repeatedly report the same transition', () => {
    const buffer = new PostureBuffer({ windowSize: 5 });

    push(buffer, 'stand_like');
    push(buffer, 'stand_like');
    push(buffer, 'stand_like');

    push(buffer, 'sit_like');
    expect(push(buffer, 'sit_like').transition).toBeNull();

    expect(push(buffer, 'sit_like').transition).toEqual({
      from: 'stand_like',
      to: 'sit_like',
    });

    expect(push(buffer, 'sit_like').transition).toBeNull();
  });

  it('resets all temporal state', () => {
    const buffer = new PostureBuffer();

    push(buffer, 'stand_like');
    push(buffer, 'stand_like');
    push(buffer, 'stand_like');

    buffer.reset();

    expect(buffer.getStablePosture()).toBeNull();
    expect(buffer.getLastTransition()).toBeNull();
    expect(push(buffer, 'sit_like').stablePosture).toBeNull();
  });
});
