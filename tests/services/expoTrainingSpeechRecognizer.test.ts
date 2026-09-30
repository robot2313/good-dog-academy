const mockNativeListeners: Record<string, ((event: unknown) => void) | undefined> = {};
const mockRemove = jest.fn();
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockAbort = jest.fn();
const mockRequestPermissionsAsync = jest.fn(async () => ({ granted: true }));
const mockIsRecognitionAvailable = jest.fn(() => true);

jest.mock('expo-speech-recognition', () => ({
  ExpoSpeechRecognitionModule: {
    isRecognitionAvailable: mockIsRecognitionAvailable,
    requestPermissionsAsync: mockRequestPermissionsAsync,
    start: mockStart,
    stop: mockStop,
    abort: mockAbort,
    addListener: jest.fn((event: string, listener: (event: unknown) => void) => {
      mockNativeListeners[event] = listener;
      return { remove: mockRemove };
    }),
  },
}));

import { ExpoTrainingSpeechRecognizer } from '../../src/services/speech/ExpoTrainingSpeechRecognizer';

describe('ExpoTrainingSpeechRecognizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockNativeListeners).forEach((key) => delete mockNativeListeners[key]);
    mockIsRecognitionAvailable.mockReturnValue(true);
    mockRequestPermissionsAsync.mockResolvedValue({ granted: true });
  });

  it('reports native availability and requests permission', async () => {
    const recognizer = new ExpoTrainingSpeechRecognizer();

    await expect(recognizer.getAvailability()).resolves.toEqual({ available: true });
    await expect(recognizer.requestPermission()).resolves.toBe(true);
  });

  it('starts one-shot Australian English recognition', async () => {
    const recognizer = new ExpoTrainingSpeechRecognizer();

    await recognizer.start();

    expect(mockStart).toHaveBeenCalledWith({ lang: 'en-AU', interimResults: false, continuous: false });
  });

  it('normalises a final native result and clamps confidence', async () => {
    const recognizer = new ExpoTrainingSpeechRecognizer();
    const listener = jest.fn();
    recognizer.onResult(listener);
    await recognizer.getAvailability();

    mockNativeListeners.result?.({
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

    mockNativeListeners.error?.({ error: 'network', message: 'Recognition unavailable.' });
    recognizer.dispose();

    expect(listener).toHaveBeenCalledWith('Recognition unavailable.');
    expect(mockRemove).toHaveBeenCalledTimes(2);
  });
});
