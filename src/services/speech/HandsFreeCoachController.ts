import { parseOwnerVoiceIntent, type OwnerVoiceIntent } from '../../domain/behaviour/OwnerVoiceIntent';
import type { SpeechRecognitionAvailability, TrainingSpeechRecognizer } from './TrainingSpeechRecognizer';

export type HandsFreeCoachEvent =
  | { type: 'intent'; intent: Exclude<OwnerVoiceIntent, 'unknown'>; transcript: string }
  | { type: 'unclear'; transcript: string }
  | { type: 'error'; message: string };

export class HandsFreeCoachController {
  private unsubscribeResult: (() => void) | null = null;
  private unsubscribeError: (() => void) | null = null;
  private listener: ((event: HandsFreeCoachEvent) => void) | null = null;
  private listening = false;

  constructor(private readonly recognizer: TrainingSpeechRecognizer) {
    this.unsubscribeResult = recognizer.onResult((result) => {
      if (!this.listening || !result.isFinal) return;
      const intent = parseOwnerVoiceIntent(result.transcript);
      if (intent === 'unknown') {
        this.listener?.({ type: 'unclear', transcript: result.transcript });
        return;
      }

      // Never suppress a spoken stop/break command because of recognizer confidence.
      // Other state-changing commands fail closed when confidence is explicitly low.
      if (intent !== 'stop' && result.confidence !== null && result.confidence < 0.45) {
        this.listener?.({ type: 'unclear', transcript: result.transcript });
        return;
      }

      this.listener?.({ type: 'intent', intent, transcript: result.transcript });
    });
    this.unsubscribeError = recognizer.onError((message) => this.listener?.({ type: 'error', message }));
  }

  onEvent(listener: (event: HandsFreeCoachEvent) => void): () => void {
    this.listener = listener;
    return () => {
      if (this.listener === listener) this.listener = null;
    };
  }

  getAvailability(): Promise<SpeechRecognitionAvailability> {
    return this.recognizer.getAvailability();
  }

  async start(): Promise<boolean> {
    const availability = await this.recognizer.getAvailability();
    if (!availability.available) return false;
    const granted = await this.recognizer.requestPermission();
    if (!granted) return false;
    this.listening = true;
    await this.recognizer.start({ locale: 'en-AU', interimResults: false });
    return true;
  }

  async stop(): Promise<void> {
    this.listening = false;
    await this.recognizer.stop();
  }

  async abort(): Promise<void> {
    this.listening = false;
    await this.recognizer.abort();
  }

  dispose(): void {
    this.listening = false;
    this.unsubscribeResult?.();
    this.unsubscribeError?.();
    this.unsubscribeResult = null;
    this.unsubscribeError = null;
    this.listener = null;
  }
}
