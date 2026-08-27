import { act, fireEvent, render } from '@testing-library/react-native';

import type { LessonProgress } from '../../src/domain/models';
import { LessonCatalogue } from '../../src/features/lessons/catalogue';
import { LessonLibraryService } from '../../src/features/lessons/library';
import { LessonLibraryScreenView } from '../../src/features/lessons/library/LessonLibraryScreenView';
import { LessonSummaryScreenView } from '../../src/features/lessons/library/LessonSummaryScreenView';
import { advancedLesson, foundationLesson, lessonDefinitions, lessonProgress, recallLesson } from '../support/lessonFixtures';

const catalogue = LessonCatalogue.load(lessonDefinitions);
const availableService = new LessonLibraryService(catalogue, 'dog-fixture-001', []);

describe('Lesson Library UI', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('renders selected-dog context, deterministic groups, metadata, states, and lock information', () => {
    const view = renderLibrary();

    expect(view.getByText('Lesson Library')).toBeTruthy();
    expect(view.getByText('Scout')).toBeTruthy();
    expect(view.getByRole('header', { name: 'Recall lessons' })).toBeTruthy();
    expect(view.getByRole('header', { name: 'Impulse Control lessons' })).toBeTruthy();
    expect(view.getByRole('header', { name: 'Focus lessons' })).toBeTruthy();
    expect(view.getByText(foundationLesson.title)).toBeTruthy();
    expect(view.getAllByText('Level 1').length).toBeGreaterThan(0);
    expect(view.getAllByText('5 min')).toHaveLength(3);
    expect(view.getByText('Available')).toBeTruthy();
    expect(view.getAllByText('Locked')).toHaveLength(2);
    expect(view.getByText(`Complete ${foundationLesson.title} first.`)).toBeTruthy();
    expect(view.getByRole('button', { name: `${foundationLesson.title}. Focus. Level 1. 5 minutes. Available.` })).toBeTruthy();
    expect(view.getByRole('button', { name: `${recallLesson.title}. Recall. Level 2. 5 minutes. Locked. Complete ${foundationLesson.title} first.` })).toBeTruthy();
  });

  it('limits the visible library to a discovery category scope', () => {
    const view = renderLibrary({ scope: { type: 'skill', skill: 'recall' } });

    expect(view.getByLabelText('1 lesson')).toBeTruthy();
    expect(view.getByRole('header', { name: 'Recall lessons' })).toBeTruthy();
    expect(view.getByText(recallLesson.title)).toBeTruthy();
    expect(view.queryByText(foundationLesson.title)).toBeNull();
    expect(view.queryByText(advancedLesson.title)).toBeNull();
  });

  it('presents locked category lessons as self-directed choices when enabled', () => {
    const onOpenLesson = jest.fn();
    const view = renderLibrary({
      scope: { type: 'skill', skill: 'recall' },
      allowLockedSelection: true,
      onOpenLesson,
    });

    expect(view.getByText('Self-directed')).toBeTruthy();
    expect(view.getByText(/You can choose this lesson now/)).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: new RegExp(`^${recallLesson.title}`) }));
    expect(onOpenLesson).toHaveBeenCalledWith(recallLesson.id);
  });

  it('opens both available and locked lesson summaries without starting training', () => {
    const onOpenLesson = jest.fn();
    const view = renderLibrary({ onOpenLesson });

    fireEvent.press(view.getByRole('button', { name: new RegExp(`^${foundationLesson.title}`) }));
    fireEvent.press(view.getByRole('button', { name: new RegExp(`^${recallLesson.title}`) }));
    expect(onOpenLesson).toHaveBeenNthCalledWith(1, foundationLesson.id);
    expect(onOpenLesson).toHaveBeenNthCalledWith(2, recallLesson.id);
    expect(view.queryByText(/start training/i)).toBeNull();
  });

  it('renders an in-progress state as text and in the card announcement', () => {
    const progress = lessonProgress({ dogId: 'dog-fixture-001', status: 'inProgress', attempts: 1, lastAttemptedAt: '2026-07-22T01:00:00.000Z' });
    const service = new LessonLibraryService(catalogue, 'dog-fixture-001', [progress]);
    const view = renderLibrary({ service });

    expect(view.getByText('In progress')).toBeTruthy();
    expect(view.getByRole('button', { name: `${foundationLesson.title}. Focus. Level 1. 5 minutes. In progress.` })).toBeTruthy();
  });

  it('renders a completed state as text and in the card announcement', () => {
    const progress = lessonProgress({
      status: 'completed',
      dogId: 'dog-fixture-001',
      attempts: 1,
      successfulCompletions: 1,
      bestPerformanceRating: 3,
      lastAttemptedAt: '2026-07-22T01:00:00.000Z',
      lastCompletedAt: '2026-07-22T01:00:00.000Z',
    });
    const service = new LessonLibraryService(catalogue, 'dog-fixture-001', [progress]);
    const view = renderLibrary({ service });

    expect(view.getByText('Completed')).toBeTruthy();
    expect(view.getByRole('button', { name: `${foundationLesson.title}. Focus. Level 1. 5 minutes. Completed.` })).toBeTruthy();
  });

  it('shows accessible loading, empty-catalogue, missing-dog, corrupt-progress, and unexpected-error states', () => {
    const retry = jest.fn();
    const loading = renderLibrary({ loading: true, onRetry: retry });
    expect(loading.getByRole('progressbar')).toBeTruthy();
    expect(loading.getByText(/Loading the lesson library/)).toBeTruthy();
    loading.unmount();

    const emptyService = new LessonLibraryService(LessonCatalogue.load([]), 'dog-fixture-001', []);
    const empty = renderLibrary({ service: emptyService });
    expect(empty.getByText('No lessons are available yet')).toBeTruthy();
    expect(empty.queryByText('No lessons match your search')).toBeNull();
    empty.unmount();

    const missingDog = renderLibrary({ dogName: null, service: new LessonLibraryService(catalogue, null, []), onRetry: retry });
    expect(missingDog.getByText(/No dog is currently selected/)).toBeTruthy();
    fireEvent.press(missingDog.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
    missingDog.unmount();

    const corrupt = { ...lessonProgress(), attempts: -1 } as LessonProgress;
    const corruptProgress = renderLibrary({ service: new LessonLibraryService(catalogue, 'dog-fixture-001', [corrupt]), onRetry: retry });
    expect(corruptProgress.getByText(/progress could not be read safely/)).toBeTruthy();
    corruptProgress.unmount();

    const unexpected = renderLibrary({ error: new Error('storage unavailable'), onRetry: retry });
    expect(unexpected.getByText(/library could not be loaded/)).toBeTruthy();
    fireEvent.press(unexpected.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(2);
  });

  it('searches title, description, and keywords case-insensitively with whitespace handling', () => {
    const view = renderLibrary();
    const input = view.getByLabelText('Search lessons');

    fireEvent.changeText(input, '  FIXTURE RECALL  ');
    expect(view.getByLabelText('1 lesson found')).toBeTruthy();
    expect(view.getByText(recallLesson.title)).toBeTruthy();
    expect(view.queryByText(foundationLesson.title)).toBeNull();

    fireEvent.changeText(input, 'IMPULSE CONTROL');
    expect(view.getByText(advancedLesson.title)).toBeTruthy();
    expect(view.getByLabelText('1 lesson found')).toBeTruthy();

    fireEvent.changeText(input, 'test-only foundation');
    expect(view.getByLabelText('3 lessons found')).toBeTruthy();

    fireEvent.press(view.getByRole('button', { name: 'Clear lesson search' }));
    expect(view.getByLabelText('3 lessons')).toBeTruthy();
  });

  it('shows a distinct no-results state and restores results with clear actions', () => {
    const view = renderLibrary();
    fireEvent.changeText(view.getByLabelText('Search lessons'), 'nothing matches this');

    expect(view.getByText('No lessons match your search')).toBeTruthy();
    expect(view.queryByText('No lessons are available yet')).toBeNull();
    fireEvent.press(view.getByRole('button', { name: 'Clear search' }));
    expect(view.getByLabelText('3 lessons')).toBeTruthy();
  });

  it('combines skill, difficulty, and state filters, reports them, and hides empty groups', () => {
    const view = renderLibrary();
    fireEvent.press(view.getByRole('button', { name: 'Filters' }));

    const recallFilter = view.getByRole('button', { name: 'Skill: Recall' });
    fireEvent.press(recallFilter);
    expect(view.getByRole('button', { name: 'Skill: Recall' }).props.accessibilityState).toEqual({ selected: true });
    expect(view.getByRole('header', { name: 'Recall lessons' })).toBeTruthy();
    expect(view.queryByRole('header', { name: 'Focus lessons' })).toBeNull();

    fireEvent.press(view.getByRole('button', { name: 'Difficulty: Level 2' }));
    fireEvent.press(view.getByRole('button', { name: 'State: Locked' }));
    expect(view.getByLabelText('1 lesson found')).toBeTruthy();
    expect(view.getByText('Skill: Recall')).toBeTruthy();
    expect(view.getAllByText('Level 2').length).toBeGreaterThan(0);
    expect(view.getAllByText('Locked').length).toBeGreaterThan(0);
    expect(view.getByRole('button', { name: 'Filters, 3 active' }).props.accessibilityState).toEqual({ expanded: true });

    fireEvent.press(view.getByRole('button', { name: 'Clear all lesson filters' }));
    expect(view.getByLabelText('3 lessons')).toBeTruthy();
    expect(view.getByRole('button', { name: 'All skills' }).props.accessibilityState).toEqual({ selected: true });
  });

  it('keeps search and filters independent and offers a combined reset', () => {
    const view = renderLibrary();
    fireEvent.changeText(view.getByLabelText('Search lessons'), 'fixture advanced');
    fireEvent.press(view.getByRole('button', { name: 'Filters' }));
    fireEvent.press(view.getByRole('button', { name: 'Skill: Recall' }));

    expect(view.getByText('No lessons match your search')).toBeTruthy();
    fireEvent.press(view.getByLabelText('Clear all lesson filters'));
    expect(view.getByDisplayValue('fixture advanced')).toBeTruthy();
    expect(view.getByText(advancedLesson.title)).toBeTruthy();

    fireEvent.press(view.getByRole('button', { name: 'Skill: Recall' }));
    fireEvent.press(view.getByRole('button', { name: 'Clear all search and filters' }));
    expect(view.getByLabelText('3 lessons')).toBeTruthy();
    expect(view.queryByDisplayValue('fixture advanced')).toBeNull();
  });
});

describe('Get Ready (lesson summary)', () => {
  it('shows the goal and required equipment, then advances with Next', () => {
    const onStart = jest.fn();
    const view = render(<LessonSummaryScreenView lessonId={foundationLesson.id} lessonDefinition={foundationLesson} dogName="Scout" service={availableService} loading={false} error={null} onRetry={jest.fn()} onBack={jest.fn()} onStart={onStart} />);
    expect(view.getByText(/GET READY/)).toBeTruthy();
    expect(view.getByRole('header', { name: foundationLesson.title })).toBeTruthy();
    expect(view.getByText(foundationLesson.goal)).toBeTruthy();
    expect(view.getByRole('header', { name: 'Before we start' })).toBeTruthy();
    // Foundation fixture has no equipment, so the neutral reward fallback shows.
    expect(view.getByText('Small rewards your dog enjoys')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Next' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('shows why a locked lesson is locked and offers no Next action', () => {
    const view = render(<LessonSummaryScreenView lessonId={recallLesson.id} lessonDefinition={recallLesson} dogName="Scout" service={availableService} loading={false} error={null} onRetry={jest.fn()} onBack={jest.fn()} onStart={jest.fn()} />);
    expect(view.getByText(/GET READY/)).toBeTruthy();
    expect(view.getByRole('header', { name: recallLesson.title })).toBeTruthy();
    expect(view.getByText('Why this lesson is locked')).toBeTruthy();
    expect(view.getByText(`Complete ${foundationLesson.title} first.`)).toBeTruthy();
    expect(view.getByText(`Required first: ${foundationLesson.title}`)).toBeTruthy();
    expect(view.queryByRole('button', { name: 'Next' })).toBeNull();
  });

  it('allows a category-selected lesson later in the Journey to start as self-directed training', () => {
    const onStart = jest.fn();
    const view = render(<LessonSummaryScreenView lessonId={recallLesson.id} lessonDefinition={recallLesson} dogName="Scout" service={availableService} loading={false} error={null} onRetry={jest.fn()} allowLockedStart onBack={jest.fn()} onStart={onStart} />);

    expect(view.getByText('Later in the recommended Journey')).toBeTruthy();
    expect(view.getByText('Self-directed')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Next' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('handles invalid lesson IDs safely and returns to the library', () => {
    const onBack = jest.fn();
    const view = render(<LessonSummaryScreenView lessonId="missing-library-lesson" lessonDefinition={null} dogName="Scout" service={availableService} loading={false} error={null} onRetry={jest.fn()} onBack={onBack} onStart={jest.fn()} />);
    expect(view.getByText(/no longer available/)).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Back to Lesson Library' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

function renderLibrary(overrides: Partial<React.ComponentProps<typeof LessonLibraryScreenView>> = {}) {
  return render(<LessonLibraryScreenView
    dogName="Scout"
    service={availableService}
    loading={false}
    error={null}
    onRetry={jest.fn()}
    onOpenLesson={jest.fn()}
    {...overrides}
  />);
}
