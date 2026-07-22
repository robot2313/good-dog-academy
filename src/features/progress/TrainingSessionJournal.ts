import type { BehaviourSkill, TrainingOutcome, TrainingSession } from '../../domain/models';
import type { LessonCatalogue } from '../lessons/catalogue';

export type SessionOutcomeFilter = TrainingOutcome | 'all';
export type SessionSkillFilter = BehaviourSkill | 'all';

export type SessionJournalEntry = {
  session: TrainingSession;
  lessonTitle: string;
  skill: BehaviourSkill | null;
};

export type SessionJournalFilters = {
  query: string;
  outcome: SessionOutcomeFilter;
  skill: SessionSkillFilter;
};

export const sessionOutcomeLabels: Readonly<Record<TrainingOutcome, string>> = Object.freeze({
  success: 'Great',
  'partial-success': 'Good',
  unsuccessful: 'Needs practice',
});

export function createSessionJournal(sessions: readonly TrainingSession[], catalogue: LessonCatalogue): readonly SessionJournalEntry[] {
  return [...sessions]
    .sort((left, right) => sessionDate(right).localeCompare(sessionDate(left)))
    .map((session) => {
      const lesson = catalogue.findById(session.lessonId);
      return { session, lessonTitle: lesson?.title ?? 'Training session', skill: lesson?.skill ?? null };
    });
}

export function filterSessionJournal(entries: readonly SessionJournalEntry[], filters: SessionJournalFilters): readonly SessionJournalEntry[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return entries.filter((entry) => {
    if (filters.outcome !== 'all' && entry.session.outcome !== filters.outcome) return false;
    if (filters.skill !== 'all' && entry.skill !== filters.skill) return false;
    if (!query) return true;
    const searchText = [
      entry.lessonTitle,
      entry.skill?.replaceAll('-', ' ') ?? '',
      entry.session.notes,
      entry.session.outcome ? sessionOutcomeLabels[entry.session.outcome] : '',
    ].join(' ').toLocaleLowerCase();
    return searchText.includes(query);
  });
}

export function createSessionJournalCsv(entries: readonly SessionJournalEntry[]): string {
  const rows = entries.map((entry) => [
    sessionDate(entry.session).slice(0, 10),
    entry.lessonTitle,
    entry.skill?.replaceAll('-', ' ') ?? '',
    String(entry.session.durationMinutes),
    entry.session.outcome ? sessionOutcomeLabels[entry.session.outcome] : '',
    entry.session.notes,
  ]);
  return [
    ['Date', 'Lesson', 'Skill', 'Duration (minutes)', 'Outcome', 'Notes'],
    ...rows,
  ].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export function createSessionJournalFileName(dogName: string, now = new Date()): string {
  const dogSlug = dogName.trim().toLocaleLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'dog';
  return `good-dog-academy-${dogSlug}-${now.toISOString().slice(0, 10)}.csv`;
}

function sessionDate(session: TrainingSession): string {
  return session.completedAt ?? session.startedAt;
}

function csvCell(value: string): string {
  const safeValue = /^\s*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}
