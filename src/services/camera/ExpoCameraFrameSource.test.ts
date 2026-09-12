import { ExpoCameraFrameSource } from './ExpoCameraFrameSource';

describe('ExpoCameraFrameSource', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts immediately, emits sampled frames, and respects the minimum interval', async () => {
    const capture = jest.fn().mockResolvedValue({
      uri: 'file:///frame.jpg',
      width: 640,
      height: 480,
    });
    const listener = jest.fn();
    const source = new ExpoCameraFrameSource(capture, 100);
    source.subscribe(listener);

    await source.start();
    await jest.advanceTimersByTimeAsync(0);

    expect(capture).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toMatchObject({
      width: 640,
      height: 480,
      rotationDegrees: 0,
      uri: 'file:///frame.jpg',
    });

    await jest.advanceTimersByTimeAsync(249);
    expect(capture).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(capture).toHaveBeenCalledTimes(2);

    await source.stop();
  });

  it('does not overlap captures and stops scheduling after stop', async () => {
    let resolveCapture!: (value: { uri: string; width: number; height: number }) => void;
    const capture = jest.fn(() => new Promise<{ uri: string; width: number; height: number }>((resolve) => {
      resolveCapture = resolve;
    }));
    const source = new ExpoCameraFrameSource(capture, 250);

    await source.start();
    await jest.advanceTimersByTimeAsync(0);
    expect(capture).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1000);
    expect(capture).toHaveBeenCalledTimes(1);

    resolveCapture({ uri: 'file:///frame.jpg', width: 640, height: 480 });
    await Promise.resolve();
    await Promise.resolve();
    await source.stop();
    await jest.advanceTimersByTimeAsync(1000);

    expect(capture).toHaveBeenCalledTimes(1);
  });

  it('allows listeners to unsubscribe without stopping the source', async () => {
    const capture = jest.fn().mockResolvedValue({
      uri: 'file:///frame.jpg',
      width: 640,
      height: 480,
    });
    const listener = jest.fn();
    const source = new ExpoCameraFrameSource(capture, 250);
    const unsubscribe = source.subscribe(listener);

    await source.start();
    await jest.advanceTimersByTimeAsync(0);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    await jest.advanceTimersByTimeAsync(250);
    expect(capture).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledTimes(1);

    await source.stop();
  });
});
