import type { LessonDefinition, LessonId } from '../../../domain/models';
import { validateLessonDefinition } from '../../../domain/validation';
import { LessonCatalogueError } from './LessonCatalogueError';

function compareIds(a: LessonId, b: LessonId): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function immutableCopy(definition: LessonDefinition): LessonDefinition {
  return Object.freeze({
    ...definition,
    equipment: Object.freeze([...definition.equipment]),
    prerequisites: Object.freeze(definition.prerequisites.map((item) => Object.freeze({ ...item }))),
    steps: Object.freeze([...definition.steps]),
    tips: Object.freeze([...definition.tips]),
    commonMistakes: Object.freeze([...definition.commonMistakes]),
    troubleshooting: Object.freeze(definition.troubleshooting.map((item) => Object.freeze({ ...item }))),
    safetyNotes: Object.freeze([...definition.safetyNotes]),
    completionCriteria: Object.freeze({ ...definition.completionCriteria }),
    tags: Object.freeze([...definition.tags]),
  });
}

export class LessonCatalogue {
  private readonly byId: ReadonlyMap<LessonId, LessonDefinition>;
  readonly definitions: readonly LessonDefinition[];

  private constructor(definitions: readonly LessonDefinition[]) {
    this.definitions = Object.freeze([...definitions]);
    this.byId = new Map(definitions.map((definition) => [definition.id, definition]));
  }

  static load(input: readonly unknown[]): LessonCatalogue {
    const validated: LessonDefinition[] = [];
    input.forEach((candidate, index) => {
      const result = validateLessonDefinition(candidate);
      if (!result.valid) throw new LessonCatalogueError('INVALID_LESSON_CATALOGUE', { index, lessonId: typeof candidate === 'object' && candidate !== null && 'id' in candidate ? String(candidate.id) : null, validationErrors: result.errors });
      validated.push(result.value);
    });

    const ids = validated.map((definition) => definition.id);
    const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))].sort(compareIds);
    if (duplicateIds.length) throw new LessonCatalogueError('DUPLICATE_LESSON_IDS', { lessonIds: duplicateIds });

    const idsSet = new Set(ids);
    const missing = validated.flatMap((definition) => definition.prerequisites
      .filter((prerequisite) => !idsSet.has(prerequisite.lessonId))
      .map((prerequisite) => ({ lessonId: definition.id, prerequisiteId: prerequisite.lessonId })));
    if (missing.length) throw new LessonCatalogueError('MISSING_LESSON_PREREQUISITES', { references: missing });

    LessonCatalogue.assertAcyclic(validated);
    const ordered = [...validated].sort((a, b) => a.difficultyLevel - b.difficultyLevel || compareIds(a.id, b.id));
    return new LessonCatalogue(ordered.map(immutableCopy));
  }

  findById(id: LessonId): LessonDefinition | null {
    return this.byId.get(id) ?? null;
  }

  requireById(id: LessonId): LessonDefinition {
    const definition = this.findById(id);
    if (!definition) throw new LessonCatalogueError('MISSING_LESSON_PREREQUISITES', { lessonId: id });
    return definition;
  }

  private static assertAcyclic(definitions: readonly LessonDefinition[]): void {
    const byId = new Map(definitions.map((definition) => [definition.id, definition]));
    const visiting = new Set<LessonId>();
    const visited = new Set<LessonId>();
    const path: LessonId[] = [];

    const visit = (id: LessonId): void => {
      if (visiting.has(id)) {
        const start = path.indexOf(id);
        throw new LessonCatalogueError('CIRCULAR_LESSON_PREREQUISITES', { cycle: [...path.slice(start), id] });
      }
      if (visited.has(id)) return;
      visiting.add(id);
      path.push(id);
      for (const prerequisite of byId.get(id)?.prerequisites ?? []) visit(prerequisite.lessonId);
      path.pop();
      visiting.delete(id);
      visited.add(id);
    };

    for (const definition of definitions) visit(definition.id);
  }
}
