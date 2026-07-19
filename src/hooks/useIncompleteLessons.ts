import { useMemo } from 'react';

import { lessons } from '../data/lessons';
import { useAppState } from '../state/AppStateContext';

export function useIncompleteLessons(limit?: number) {
  const { completed } = useAppState();

  return useMemo(() => {
    const incomplete = lessons.filter((lesson) => !completed.includes(lesson.id));
    return typeof limit === 'number' ? incomplete.slice(0, limit) : incomplete;
  }, [completed, limit]);
}
