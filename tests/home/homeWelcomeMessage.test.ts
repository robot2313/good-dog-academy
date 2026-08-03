import { homeWelcomeMessage } from '../../src/features/home/homeWelcomeMessage';

describe('homeWelcomeMessage', () => {
  it('prompts to add a dog when no dog profile exists', () => {
    const message = homeWelcomeMessage({ dogName: null, completedLessons: 0, sessionCount: 0, successRate: null });
    expect(message.title).toBe('Welcome to Good Dog Academy');
    expect(message.lines[0]).toMatch(/Add your dog to begin/);
  });

  it('welcomes a brand-new dog with no sessions or lessons', () => {
    const message = homeWelcomeMessage({ dogName: 'Baxter', completedLessons: 0, sessionCount: 0, successRate: null });
    expect(message.title).toBe('Welcome to Good Dog Academy');
    expect(message.lines[0]).toBe('You and Baxter are about to begin building great habits together. Keep the first sessions short, positive and easy.');
    expect(message.lines[1]).toBe('The first lesson is ready whenever you are.');
  });

  it('uses real counts with correct pluralisation and points to the Dog section report', () => {
    const one = homeWelcomeMessage({ dogName: 'Baxter', completedLessons: 1, sessionCount: 4, successRate: 0.9 });
    expect(one.title).toBe('Welcome back, Baxter');
    expect(one.lines[0]).toBe('Baxter has completed 1 lesson so far.');
    expect(one.lines).toContain("For the complete report, open Baxter's profile from the Dog section below.");

    const many = homeWelcomeMessage({ dogName: 'Baxter', completedLessons: 4, sessionCount: 6, successRate: 0.9 });
    expect(many.lines[0]).toBe('Baxter has completed 4 lessons so far.');
  });

  it('describes strong performance only when the success rate genuinely supports it', () => {
    const strong = homeWelcomeMessage({ dogName: 'Baxter', completedLessons: 3, sessionCount: 5, successRate: 0.8 });
    expect(strong.lines[1]).toBe('Baxter is training with a strong success rate.');

    const mixed = homeWelcomeMessage({ dogName: 'Baxter', completedLessons: 2, sessionCount: 5, successRate: 0.4 });
    expect(mixed.lines[1]).toBe('Baxter is building consistency with every short practice.');
  });

  it('stays neutral when there is too little data to judge performance', () => {
    const message = homeWelcomeMessage({ dogName: 'Baxter', completedLessons: 0, sessionCount: 2, successRate: 0.5 });
    expect(message.title).toBe('Welcome back, Baxter');
    expect(message.lines[0]).toBe('Baxter has practised 2 sessions so far.');
    expect(message.lines[1]).toBe('Every positive repetition is helping Baxter learn.');
  });

  it('never makes unearned performance claims', () => {
    const messages = [
      homeWelcomeMessage({ dogName: 'Baxter', completedLessons: 5, sessionCount: 6, successRate: 0.95 }),
      homeWelcomeMessage({ dogName: 'Baxter', completedLessons: 1, sessionCount: 5, successRate: 0.3 }),
    ];
    for (const message of messages) {
      const text = [message.title, ...message.lines].join(' ').toLowerCase();
      expect(text).not.toMatch(/above average|excellent|improving|mastered/);
    }
  });
});
