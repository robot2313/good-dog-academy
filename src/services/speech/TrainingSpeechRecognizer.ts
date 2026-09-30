export type SpeechRecognitionAvailability =
  | { available: true }
  | { available: false; reason: 'unsupported' | 'expo-go' | 'permission-denied' | 'unavailable' };

export type SpeechRecognitionResult = {
  transcript: string;
  confidence: number | null;
  isFinal: boolean;
  receivedAt: string;
};

export type SpeechRecognitionOptions = {
  locale?: string;
  interimResults?: boolean;
};

export interface TrainingSpeechRecognizer {
  getAvailability(): Promise<SpeechRecognitionAvailability>;
  requestPermission(): Promise<boolean>;
  start(options?: SpeechRecognitionOptions): Promise<void>;
  stop(): Promise<void>;
  abort(): Promise<void>;
  onResult(listener: (result: SpeechRecognitionResult) => void): () => void;
  onError(listener: (message: string) => void): () => void;
}
