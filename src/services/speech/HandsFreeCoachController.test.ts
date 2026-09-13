import { HandsFreeCoachController } from './HandsFreeCoachController';
import type {
  SpeechRecognitionOptions,
  SpeechRecognitionResult,
  TrainingSpeechRecognizer,
} from './TrainingSpeechRecognizer';

class FakeRecognizer implements TrainingSpeechRecognizer {
  private resultListener: ((result: SpeechRecognitionResult) => void) | null = null;
  private errorListener: ((message: string) => void) | null = null;
  available = true;
  permission = true;
  starts: SpeechRecognitionOptions[] = [];

  async getAvailability() { return this.available ? { available: true as const } : { available: false as const, reason: 'unsupported' as const }; }
  async requestPermission() { return this.permission; }
  async start(options: SpeechRecognitionOptions = {}) { this.starts.push(options); }
  async stop() {}
  async abort() {}
  onResult(listener: (result: SpeechRecognitionResult) => void) { this.resultListener = listener; return () => { this.resultListener = null; }; }
  onError(listener: (message: string) => void) { this.errorListener = listener; return () => { this.errorListener = null; }; }
  emit(transcript: string, confidence: number | null = 0.9, isFinal = true) {
    this.resultListener?.({ transcript, confidence, isFinal, receivedAt: new Date().toISOString() });
  }
  fail(message: string) { this.errorListener?.(message); }
}

describe('HandsFreeCoachController', () => {
  it('starts only when recognition is available and permission is granted', async () => {
    const recognizer = new FakeRecognizer();
    const controller = new HandsFreeCoachController(recognizer);

    await expect(controller.start()).resolves.toBe(true);
    expect(recognizer.starts).toEqual([{ locale: 'en-AU', interimResults: false }]);
  });

  it('fails closed when the build cannot recognise speech', async () => {
    const recognizer = new FakeRecognizer();
    recognizer.available = false;
    const controller = new HandsFreeCoachController(recognizer);

    await expect(controller.start()).resolves.toBe(false);
    expect(recognizer.starts).toHaveLength(0);
  });

  it('emits a clear owner intent only from final confident speech', async () => {
    const recognizer = new FakeRecognizer();
    const controller = new HandsFreeCoachController(recognizer);
    const events: unknown[] = [];
    controller.onEvent((event) => events.push(event));
    await controller.start();

    recognizer.emit('yes', 0.9, false);
    recognizer.emit('yes', 0.9, true);

    expect(events).toEqual([{ type: 'intent', intent: 'success', transcript: 'yes' }]);
  });

  it('does not mutate training from low-confidence scoring speech', async () => {
    const recognizer = new FakeRecognizer();
    const controller = new HandsFreeCoachController(recognizer);
    const events: unknown[] = [];
    controller.onEvent((event) => events.push(event));
    await controller.start();

    recognizer.emit('success', 0.2);

    expect(events).toEqual([{ type: 'unclear', transcript: 'success' }]);
  });

  it('always surfaces a stop command even if recognizer confidence is low', async () => {
    const recognizer = new FakeRecognizer();
    const controller = new HandsFreeCoachController(recognizer);
    const events: unknown[] = [];
    controller.onEvent((event) => events.push(event));
    await controller.start();

    recognizer.emit('stop the session', 0.1);

    expect(events).toEqual([{ type: 'intent', intent: 'stop', transcript: 'stop the session' }]);
  });

  it('passes recognizer errors through to the UI layer', async () => {
    const recognizer = new FakeRecognizer();
    const controller = new HandsFreeCoachController(recognizer);
    const events: unknown[] = [];
    controller.onEvent((event) => events.push(event));
    await controller.start();

    recognizer.fail('microphone unavailable');

    expect(events).toEqual([{ type: 'error', message: 'microphone unavailable' }]);
  });
});
