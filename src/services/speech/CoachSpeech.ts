export type CoachSpeechOptions = {
  interrupt?: boolean;
  rate?: number;
};

export interface CoachSpeech {
  speak(text: string, options?: CoachSpeechOptions): Promise<void>;
  stop(): Promise<void>;
}
