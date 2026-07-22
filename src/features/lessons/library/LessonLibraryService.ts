import { behaviourSkills, type LessonDefinition, type LessonId, type LessonProgress, type LessonProgressStatus } from '../../../domain/models';
import { validateLessonProgress } from '../../../domain/validation';
import type { LessonCatalogue } from '../catalogue';
import { LessonUnlockError, LessonUnlockService } from '../progress';
import { LessonLibraryError } from './LessonLibraryError';
import type { LessonFilter, LessonGroup, LessonLibraryItem, LessonLockDetails, LessonState } from './lessonLibraryTypes';

export class LessonLibraryService {
  private items: readonly LessonLibraryItem[] | null = null;

  constructor(
    private readonly catalogue: LessonCatalogue,
    private readonly selectedDogId: string | null,
    private readonly progressRecords: readonly LessonProgress[],
  ) {}

  getAllLessons(): readonly LessonLibraryItem[] {
    if (this.items) return this.items;
    const progress = this.selectedDogProgress();
    const statuses = this.resolveStatuses(progress);
    const progressByLesson = new Map(progress.map((record) => [record.lessonId, record]));
    this.items = Object.freeze(this.catalogue.definitions.map((definition) => this.createItem(definition, statuses.get(definition.id) ?? 'locked', progressByLesson)));
    return this.items;
  }

  getGroupedLessons(): readonly LessonGroup[] {
    const lessons = this.getAllLessons();
    return Object.freeze(behaviourSkills.flatMap((skill) => {
      const groupLessons = lessons.filter((lesson) => lesson.skill === skill);
      return groupLessons.length === 0 ? [] : [Object.freeze({ skill, title: titleCase(skill.replaceAll('-', ' ')), lessons: Object.freeze(groupLessons) })];
    }));
  }

  searchLessons(query: string): readonly LessonLibraryItem[] {
    const normalizedQuery = normalizeSearchText(query.trim());
    if (!normalizedQuery) return this.getAllLessons();
    return Object.freeze(this.getAllLessons().filter((lesson) => normalizeSearchText([
      lesson.title,
      lesson.description,
      ...lesson.keywords,
    ].join(' ')).includes(normalizedQuery)));
  }

  filterLessons(filters: LessonFilter): readonly LessonLibraryItem[] {
    return Object.freeze(this.getAllLessons().filter((lesson) => (
      (filters.skill === undefined || lesson.skill === filters.skill)
      && (filters.difficulty === undefined || lesson.difficulty === filters.difficulty)
      && (filters.state === undefined || lesson.state === filters.state)
    )));
  }

  getLessonSummary(id: LessonId): LessonLibraryItem {
    const lesson = this.getAllLessons().find((item) => item.id === id);
    if (!lesson) throw new LessonLibraryError('LESSON_NOT_FOUND', { lessonId: id });
    return lesson;
  }

  private selectedDogProgress(): readonly LessonProgress[] {
    if (!this.selectedDogId?.trim()) throw new LessonLibraryError('MISSING_SELECTED_DOG');
    const validated = this.progressRecords.map((candidate, index) => {
      const result = validateLessonProgress(candidate);
      if (!result.valid) throw new LessonLibraryError('CORRUPT_PROGRESS', { index, progressId: candidate && typeof candidate === 'object' && 'id' in candidate ? String(candidate.id) : null, validationErrors: result.errors });
      return result.value;
    });
    return validated.filter((record) => record.dogId === this.selectedDogId);
  }

  private resolveStatuses(progress: readonly LessonProgress[]): ReadonlyMap<LessonId, LessonProgressStatus> {
    try {
      return new LessonUnlockService(this.catalogue).determineStatuses(progress);
    } catch (cause) {
      if (cause instanceof LessonUnlockError) throw new LessonLibraryError('CORRUPT_PROGRESS', { causeCode: cause.code, ...cause.context });
      throw cause;
    }
  }

  private createItem(definition: LessonDefinition, status: LessonProgressStatus, progressByLesson: ReadonlyMap<LessonId, LessonProgress>): LessonLibraryItem {
    const metadata = {
      id: definition.id,
      title: definition.title,
      description: definition.shortDescription,
      difficulty: definition.difficultyLevel,
      estimatedMinutes: definition.estimatedMinutes,
      skill: definition.skill,
      keywords: Object.freeze([...definition.tags]),
    } as const;
    const state = libraryState(status);
    if (state !== 'LOCKED') return Object.freeze({ ...metadata, state, lock: null });
    return Object.freeze({ ...metadata, state, lock: this.lockDetails(definition, progressByLesson) });
  }

  private lockDetails(definition: LessonDefinition, progressByLesson: ReadonlyMap<LessonId, LessonProgress>): LessonLockDetails {
    const missingDefinitions = definition.prerequisites
      .filter((prerequisite) => (progressByLesson.get(prerequisite.lessonId)?.successfulCompletions ?? 0) < prerequisite.minimumSuccessfulCompletions)
      .map((prerequisite) => this.catalogue.findById(prerequisite.lessonId))
      .filter((prerequisite): prerequisite is LessonDefinition => prerequisite !== null);
    const missingPrerequisiteIds = Object.freeze(missingDefinitions.map((prerequisite) => prerequisite.id));
    const missingPrerequisiteNames = Object.freeze(missingDefinitions.map((prerequisite) => prerequisite.title));
    const reason = !definition.isActive
      ? 'This lesson is not currently available.'
      : missingPrerequisiteNames.length === 0
        ? 'This lesson is locked.'
        : `Complete ${formatNames(missingPrerequisiteNames)} first.`;
    return Object.freeze({ reason, missingPrerequisiteIds, missingPrerequisiteNames });
  }
}

function libraryState(status: LessonProgressStatus): LessonState {
  if (status === 'available') return 'AVAILABLE';
  if (status === 'inProgress') return 'IN_PROGRESS';
  if (status === 'completed') return 'COMPLETED';
  return 'LOCKED';
}

function normalizeSearchText(value: string): string {
  return value.toLocaleLowerCase().replaceAll('-', ' ').replace(/\s+/g, ' ').trim();
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? 'the prerequisite lesson';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`;
}
