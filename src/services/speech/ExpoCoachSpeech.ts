import * as Speech from 'expo-speech';

import type { CoachSpeech, CoachSpeechOptions } from './CoachSpeech';

export class ExpoCoachSpeech implements CoachSpeech {
  async speak(text: string, options: CoachSpeechOptions = {}): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (options.interrupt) {
      await Speech.stop();
    }

    Speech.speak(trimmed, {
      language: 'en-AU',
      rate: options.rate ?? 0.92,
      pitch: 1,
    });
  }

  async stop(): Promise<void> {
    await Speech.stop();
  }
}
