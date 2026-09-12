import { spokenCoachMessage, type SpokenCoachEvent } from '../../domain/camera/SpokenCoachPolicy';
import type { CoachSpeech } from './CoachSpeech';

export class SpokenCoachController {
  private enabled = true;
  private lastText: string | null = null;

  constructor(private readonly speech: CoachSpeech) {}

  isEnabled(): boolean {
    return this.enabled;
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled = enabled;
    this.lastText = null;
    if (!enabled) await this.speech.stop();
  }

  async announce(event: SpokenCoachEvent): Promise<void> {
    if (!this.enabled) return;

    const message = spokenCoachMessage(event);
    if (!message.interrupt && message.text === this.lastText) return;

    this.lastText = message.text;
    await this.speech.speak(message.text, {
      interrupt: message.interrupt,
      rate: message.priority === 'safety' ? 0.88 : 0.92,
    });
  }

  async repeatLast(): Promise<boolean> {
    if (!this.enabled || !this.lastText) return false;
    await this.speech.speak(this.lastText, { interrupt: true, rate: 0.92 });
    return true;
  }

  async stop(): Promise<void> {
    this.lastText = null;
    await this.speech.stop();
  }
}
