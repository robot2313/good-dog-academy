import type {
  SpeechRecognitionAvailability,
  SpeechRecognitionOptions,
  SpeechRecognitionResult,
  TrainingSpeechRecognizer,
} from './TrainingSpeechRecognizer';

type NativeSubscription = { remove(): void };
type NativeResultEvent = {
  isFinal?: boolean;
  results?: Array<{ transcript?: string; confidence?: number }>;
};
type NativeErrorEvent = { error?: string; message?: string };
type NativeSpeechModule = {
  isRecognitionAvailable(): boolean;
  requestPermissionsAsync(): Promise<{ granted: boolean }>;
  start(options: { lang: string; interimResults: boolean; continuous: boolean }): void;
  stop(): void;
  abort(): void;
  addListener(event: 'result', listener: (event: NativeResultEvent) => void): NativeSubscription;
  addListener(event: 'error', listener: (event: NativeErrorEvent) => void): NativeSubscription;
};

type NativePackage = { ExpoSpeechRecognitionModule: NativeSpeechModule };

export class ExpoTrainingSpeechRecognizer implements TrainingSpeechRecognizer {
  private module: NativeSpeechModule | null = null;
  private loadFailed = false;
  private resultListeners = new Set<(result: SpeechRecognitionResult) => void>();
  private errorListeners = new Set<(message: string) => void>();
  private nativeSubscriptions: NativeSubscription[] = [];

  private load(): NativeSpeechModule | null {
    if (this.module) return this.module;
    if (this.loadFailed) return null;

    try {
      // Deliberately lazy: Expo Go does not ship this native module. A development
      // or production build includes it through the config plugin.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pkg = require('expo-speech-recognition') as NativePackage;
      this.module = pkg.ExpoSpeechRecognitionModule;
      this.nativeSubscriptions = [
        this.module.addListener('result', (event) => {
          const best = event.results?.[0];
          const transcript = best?.transcript?.trim();
          if (!transcript) return;
          const result: SpeechRecognitionResult = {
            transcript,
            confidence: typeof best.confidence === 'number' && Number.isFinite(best.confidence)
              ? Math.max(0, Math.min(1, best.confidence))
              : null,
            isFinal: event.isFinal !== false,
            receivedAt: new Date().toISOString(),
          };
          this.resultListeners.forEach((listener) => listener(result));
        }),
        this.module.addListener('error', (event) => {
          const message = event.message || event.error || 'Speech recognition failed.';
          this.errorListeners.forEach((listener) => listener(message));
        }),
      ];
      return this.module;
    } catch {
      this.loadFailed = true;
      return null;
    }
  }

  async getAvailability(): Promise<SpeechRecognitionAvailability> {
    const module = this.load();
    if (!module) return { available: false, reason: 'expo-go' };
    try {
      return module.isRecognitionAvailable()
        ? { available: true }
        : { available: false, reason: 'unsupported' };
    } catch {
      return { available: false, reason: 'unavailable' };
    }
  }

  async requestPermission(): Promise<boolean> {
    const module = this.load();
    if (!module) return false;
    try {
      return (await module.requestPermissionsAsync()).granted;
    } catch {
      return false;
    }
  }

  async start(options: SpeechRecognitionOptions = {}): Promise<void> {
    const module = this.load();
    if (!module) throw new Error('Speech recognition is unavailable in this build.');
    module.start({
      lang: options.locale ?? 'en-AU',
      interimResults: options.interimResults ?? false,
      continuous: false,
    });
  }

  async stop(): Promise<void> {
    this.load()?.stop();
  }

  async abort(): Promise<void> {
    this.load()?.abort();
  }

  onResult(listener: (result: SpeechRecognitionResult) => void): () => void {
    this.resultListeners.add(listener);
    return () => this.resultListeners.delete(listener);
  }

  onError(listener: (message: string) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  dispose(): void {
    this.nativeSubscriptions.forEach((subscription) => subscription.remove());
    this.nativeSubscriptions = [];
    this.resultListeners.clear();
    this.errorListeners.clear();
    this.module = null;
  }
}
