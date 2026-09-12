const nativeListeners: Record<string, ((event: unknown) => void) | undefined> = {};
const remove = jest.fn();
const start = jest.fn();
const stop = jest.fn();
const abort = jest.fn();
const requestPermissionsAsync = jest.fn(async () => ({ granted: true }));
const isRecognitionAvailable = jest.fn(() => true);

jest.mock('expo-speech-recognition', () => ({
  ExpoSpeechRecognitionModule: {
    isRecognitionAvailable,
    requestPermissionsAsync,
    start,
    stop,
    abort,
    addListener: jest.fn((event: string, listener: (event: unknown) => void) => {
      nativeListeners[event] = listener;
      return { remove };
    }),
  },
}));

import { ExpoTrainingSpeechRecognizer } from '../../src/services/speech/ExpoTrainingSpeechRecognizer';

describe('ExpoTrainingSpeechRecognizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(nativeListeners).forEach((key) => delete nativeListeners[key]);
    isRecognitionAvailable.mockReturnValue(true);
    requestPermissionsAsync.mockResolvedValue({ granted: true });
  });

  it('reports native availability and requests permission', async () => {
    const recognizer = new ExpoTrainingSpeechRecognizer();

    await expect(recognizer.getAvailability()).resolves.toEqual({ available: true });
    await expect(recognizer.requestPermission()).resolves.toBe(true);
  });

  it('starts one-shot Australian English recognition', async () => {
    const recognizer = new ExpoTrainingSpeechRecognizer();

    await recognizer.start();

    expect(start).toHaveBeenCalledWith({ lang: 'en-AU', interimResults: false, continuous: false });
  });

  it('normalises a final native result and clamps confidence', async () => {
    const recognizer = new ExpoTrainingSpeechRecognizer();
    const listener = jest.fn();
    recognizer.onResult(listener);
    await recognizer.getAvailability();

    nativeListeners.result?.({
      isFinal: true,
      results: [{ transcript: '  yes  ', confidence: 1.4 }],
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toMatchObject({
      transcript: 'yes',
      confidence: 1,
      isFinal: true,
    });
  });

  it('forwards native errors and disposes subscriptions', async () => {
    const recognizer = new ExpoTrainingSpeechRecognizer();
    const listener = jest.fn();
    recognizer.onError(listener);
    await recognizer.getAvailability();

    nativeListeners.error?.({ error: 'network', message: 'Recognition unavailable.' });
    recognizer.dispose();

    expect(listener).toHaveBeenCalledWith('Recognition unavailable.');
    expect(remove).toHaveBeenCalledTimes(2);
  });
});
