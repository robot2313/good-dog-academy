import type { TrainingOutcome, TrainingSession } from '../../../domain/models';
import type { DomainRepositories } from '../../../domain/repositories';
import { RepositoryValidationError } from '../../../storage/AsyncStorageRepository';
import type { LessonCatalogue } from '../../lessons/catalogue';
import {
  isValidTimeZone,
  LocalCalendarDateError,
  toLocalCalendarDate,
} from '../time/localCalendarDate';
import { TrainingHistoryError } from './TrainingHistoryError';
import type {
  GetTrainingHistoryEntryRequest,
  ListTrainingHistoryRequest,
  TrainingHistoryEntry,
  TrainingHistoryPage,
  TrainingHistoryRatingBand,
} from './TrainingHistoryTypes';

type HistoryRepositories = Pick<
  DomainRepositories,
  'owners' | 'dogs' | 'trainingSessions'
>;

export const defaultTrainingHistoryPageSize = 50;
export const maximumTrainingHistoryPageSize = 100;

export class TrainingHistoryQueryService {
  constructor(
    private readonly repositories: HistoryRepositories,
    private readonly catalogue: LessonCatalogue,
  ) {}

  async list(request: ListTrainingHistoryRequest): Promise<TrainingHistoryPage> {
    const pagination = validateListRequest(request);

    try {
      await this.requireOwnedDog(request.ownerId, request.dogId);
      const sessions = await this.repositories.trainingSessions.findAll();
      const selectedSessions = sessions.filter(
        (session) => session.dogId === request.dogId,
      );
      let excludedIncompleteCount = 0;
      const entries: TrainingHistoryEntry[] = [];

      for (const session of selectedSessions) {
        if (!isCompletedSession(session)) {
          excludedIncompleteCount += 1;
          continue;
        }
        entries.push(this.toEntry(session, request.timeZone));
      }

      entries.sort(compareHistoryEntries);
      const pageEntries = entries.slice(
        pagination.offset,
        pagination.offset + pagination.limit,
      );

      return {
        entries: pageEntries,
        totalCount: entries.length,
        excludedIncompleteCount,
        offset: pagination.offset,
        limit: pagination.limit,
        hasMore: pagination.offset + pageEntries.length < entries.length,
      };
    } catch (cause) {
      throw toTrainingHistoryError(cause, request.ownerId, request.dogId);
    }
  }

  async getById(
    request: GetTrainingHistoryEntryRequest,
  ): Promise<TrainingHistoryEntry> {
    validateIdentity(request.ownerId, request.dogId);
    if (!request.sessionId.trim()) {
      throw new TrainingHistoryError('INVALID_SESSION_ID');
    }
    validateTimeZone(request.timeZone);

    try {
      await this.requireOwnedDog(request.ownerId, request.dogId);
      const session = await this.repositories.trainingSessions.findById(
        request.sessionId,
      );
      if (
        !session
        || session.dogId !== request.dogId
        || !isCompletedSession(session)
      ) {
        throw new TrainingHistoryError('SESSION_NOT_FOUND', {
          sessionId: request.sessionId,
        });
      }
      return this.toEntry(session, request.timeZone);
    } catch (cause) {
      throw toTrainingHistoryError(cause, request.ownerId, request.dogId);
    }
  }

  private async requireOwnedDog(ownerId: string, dogId: string): Promise<void> {
    const owner = await this.repositories.owners.findById(ownerId);
    if (!owner) {
      throw new TrainingHistoryError('OWNER_NOT_FOUND', { ownerId });
    }
    const dog = await this.repositories.dogs.findById(dogId);
    if (!dog) {
      throw new TrainingHistoryError('DOG_NOT_FOUND', { dogId });
    }
    if (dog.ownerId !== owner.id) {
      throw new TrainingHistoryError('DOG_OWNERSHIP_MISMATCH', {
        ownerId,
        dogId,
      });
    }
  }

  private toEntry(
    session: TrainingSession & { completedAt: string; outcome: TrainingOutcome },
    timeZone: string,
  ): TrainingHistoryEntry {
    const lesson = this.catalogue.findById(session.lessonId);
    return {
      sessionId: session.id,
      dogId: session.dogId,
      lessonId: session.lessonId,
      dailyPlanId: session.dailyPlanId,
      lessonTitle: lesson?.title ?? 'Unknown lesson',
      lessonAvailable: lesson !== null,
      skill: lesson?.skill ?? null,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      localDate: toLocalCalendarDate(session.completedAt, timeZone),
      durationMinutes: session.durationMinutes,
      outcome: session.outcome,
      notes: session.notes,
      exactRating: null,
      ratingBand: ratingBandForOutcome(session.outcome),
    };
  }
}

function validateListRequest(
  request: ListTrainingHistoryRequest,
): { offset: number; limit: number } {
  validateIdentity(request.ownerId, request.dogId);
  validateTimeZone(request.timeZone);
  const offset = request.offset ?? 0;
  const limit = request.limit ?? defaultTrainingHistoryPageSize;
  if (!Number.isInteger(offset) || offset < 0) {
    throw new TrainingHistoryError('INVALID_OFFSET', { offset });
  }
  if (
    !Number.isInteger(limit)
    || limit < 1
    || limit > maximumTrainingHistoryPageSize
  ) {
    throw new TrainingHistoryError('INVALID_LIMIT', { limit });
  }
  return { offset, limit };
}

function validateIdentity(ownerId: string, dogId: string): void {
  if (!ownerId.trim()) throw new TrainingHistoryError('INVALID_OWNER_ID');
  if (!dogId.trim()) throw new TrainingHistoryError('INVALID_DOG_ID');
}

function validateTimeZone(timeZone: string): void {
  if (!isValidTimeZone(timeZone)) {
    throw new TrainingHistoryError('INVALID_TIMEZONE', { timeZone });
  }
}

function isCompletedSession(
  session: TrainingSession,
): session is TrainingSession & { completedAt: string; outcome: TrainingOutcome } {
  return session.completedAt !== null && session.outcome !== null;
}

function compareHistoryEntries(
  left: TrainingHistoryEntry,
  right: TrainingHistoryEntry,
): number {
  const completedDifference = Date.parse(right.completedAt)
    - Date.parse(left.completedAt);
  if (completedDifference !== 0) return completedDifference;
  return left.sessionId < right.sessionId
    ? -1
    : left.sessionId > right.sessionId
      ? 1
      : 0;
}

function ratingBandForOutcome(
  outcome: TrainingOutcome,
): TrainingHistoryRatingBand {
  if (outcome === 'success') return '4-5';
  if (outcome === 'partial-success') return '3';
  return '1-2';
}

function toTrainingHistoryError(
  cause: unknown,
  ownerId: string,
  dogId: string,
): TrainingHistoryError {
  if (cause instanceof TrainingHistoryError) return cause;
  if (cause instanceof RepositoryValidationError) {
    return new TrainingHistoryError(
      'CORRUPT_STORED_DATA',
      { ownerId, dogId },
      { cause },
    );
  }
  if (cause instanceof LocalCalendarDateError) {
    return new TrainingHistoryError(
      cause.code === 'INVALID_TIMEZONE'
        ? 'INVALID_TIMEZONE'
        : 'CORRUPT_STORED_DATA',
      { ownerId, dogId },
      { cause },
    );
  }
  return new TrainingHistoryError(
    'READ_FAILED',
    { ownerId, dogId },
    { cause },
  );
}
