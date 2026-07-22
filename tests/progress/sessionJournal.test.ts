import type { TrainingSession } from '../../src/domain/models';
import { loadBundledLessonCatalogue } from '../../src/features/lessons/catalogue';
import { createSessionJournal, createSessionJournalCsv, createSessionJournalFileName, filterSessionJournal } from '../../src/features/progress/TrainingSessionJournal';

const sessions: TrainingSession[] = [
  { id: 'session-1', dogId: 'dog-1', lessonId: 'recall-name-response', dailyPlanId: null, startedAt: '2026-07-20T08:00:00.000Z', completedAt: '2026-07-20T08:06:00.000Z', durationMinutes: 6, outcome: 'success', notes: 'Fast response in the kitchen.' },
  { id: 'session-2', dogId: 'dog-1', lessonId: 'chewing-appropriate-items', dailyPlanId: null, startedAt: '2026-07-21T09:00:00.000Z', completedAt: '2026-07-21T09:06:00.000Z', durationMinutes: 6, outcome: 'partial-success', notes: '=Needs a quieter room\nTry after breakfast.' },
];

describe('training session journal', () => {
  const journal = createSessionJournal(sessions, loadBundledLessonCatalogue());

  it('enriches and sorts sessions newest first', () => {
    expect(journal.map((entry) => entry.lessonTitle)).toEqual(['Choose Appropriate Chews', 'Name Response']);
    expect(journal[0].skill).toBe('chewing');
  });

  it('searches lesson titles, skills, notes, and friendly outcomes', () => {
    expect(filterSessionJournal(journal, { query: 'kitchen', outcome: 'all', skill: 'all' })).toHaveLength(1);
    expect(filterSessionJournal(journal, { query: 'chewing', outcome: 'all', skill: 'all' })).toHaveLength(1);
    expect(filterSessionJournal(journal, { query: 'great', outcome: 'all', skill: 'all' })[0].lessonTitle).toBe('Name Response');
  });

  it('combines outcome and skill filters', () => {
    expect(filterSessionJournal(journal, { query: '', outcome: 'partial-success', skill: 'chewing' })).toHaveLength(1);
    expect(filterSessionJournal(journal, { query: '', outcome: 'success', skill: 'chewing' })).toHaveLength(0);
  });

  it('exports stable CSV fields and neutralises spreadsheet formulas', () => {
    const csv = createSessionJournalCsv(journal);
    expect(csv).toContain('"Date","Lesson","Skill","Duration (minutes)","Outcome","Notes"');
    expect(csv).toContain('"2026-07-21","Choose Appropriate Chews","chewing","6","Good","\'=Needs a quieter room\nTry after breakfast."');
  });

  it('creates a safe, dated export filename', () => {
    expect(createSessionJournalFileName('Milo & Friends', new Date('2026-07-22T00:00:00.000Z'))).toBe('good-dog-academy-milo-friends-2026-07-22.csv');
  });
});
