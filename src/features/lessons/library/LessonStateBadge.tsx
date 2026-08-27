import { StatusPill, type StatusPillTone } from '../../../components/StatusPill';
import { lessonStateLabels } from './lessonLibraryPresentation';
import type { LessonState } from './lessonLibraryTypes';

export function LessonStateBadge({ state }: { state: LessonState }): React.JSX.Element {
  return <StatusPill label={lessonStateLabels[state]} tone={stateTone(state)} />;
}

function stateTone(state: LessonState): StatusPillTone {
  if (state === 'COMPLETED') return 'success';
  if (state === 'IN_PROGRESS') return 'warning';
  if (state === 'AVAILABLE') return 'info';
  return 'neutral';
}
