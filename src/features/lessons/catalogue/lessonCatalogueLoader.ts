import { LessonCatalogue } from './LessonCatalogue';
import { bundledLessonDefinitions } from './bundledLessonDefinitions';

let cachedCatalogue: LessonCatalogue | null = null;

export function loadBundledLessonCatalogue(): LessonCatalogue {
  if (!cachedCatalogue) cachedCatalogue = LessonCatalogue.load(bundledLessonDefinitions);
  return cachedCatalogue;
}

export function resetLessonCatalogueCacheForTests(): void {
  cachedCatalogue = null;
}
