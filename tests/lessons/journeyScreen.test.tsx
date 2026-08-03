import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fireEvent, render } from '@testing-library/react-native';

import { loadBundledLessonCatalogue } from '../../src/features/lessons/catalogue';
import { JourneyScreen } from '../../src/features/lessons/journey/JourneyScreen';
import { useLessonLibraryData } from '../../src/features/lessons/library/LessonLibraryContext';
import type { RootStackParamList } from '../../src/types/navigation';
import { lessonProgress } from '../support/lessonFixtures';

jest.mock('../../src/features/lessons/library/LessonLibraryContext', () => ({
  useLessonLibraryData: jest.fn(),
}));

const mockUseLessonLibraryData = jest.mocked(useLessonLibraryData);
const catalogue = loadBundledLessonCatalogue();
const firstLesson = catalogue.definitions[0];

function contextValue(overrides: Record<string, unknown> = {}) {
  return {
    catalogue,
    selectedDog: { id: 'dog-journey', name: 'Milo' },
    selectedOwnerId: 'owner-journey',
    progressRecords: [],
    loading: false,
    error: null,
    retry: jest.fn(),
    completeLessonSession: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useLessonLibraryData>;
}

function renderJourney() {
  const navigate = jest.fn();
  const goBack = jest.fn();
  const props = {
    navigation: { navigate, goBack },
    route: { key: 'journey', name: 'Journey', params: undefined },
  } as unknown as NativeStackScreenProps<RootStackParamList, 'Journey'>;
  return { navigate, goBack, view: render(<JourneyScreen {...props} />) };
}

describe('JourneyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the real catalogue as a journey and opens an available lesson', () => {
    mockUseLessonLibraryData.mockReturnValue(contextValue());
    const { view, navigate } = renderJourney();

    expect(view.getByRole('header', { name: 'Your journey so far' })).toBeTruthy();
    expect(view.getByText(`0 of ${catalogue.definitions.length} lessons complete`)).toBeTruthy();
    // The first lesson is the next step and is tappable.
    expect(view.getByText('Next up')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: new RegExp(`^${firstLesson.title}\\.`) }));
    expect(navigate).toHaveBeenCalledWith('LessonSummary', { lessonId: firstLesson.id });
  });

  it('reflects real completion data with a completed marker and updated count', () => {
    mockUseLessonLibraryData.mockReturnValue(contextValue({
      progressRecords: [lessonProgress({
        id: 'progress-journey-1',
        dogId: 'dog-journey',
        ownerId: 'owner-journey',
        lessonId: firstLesson.id,
        status: 'completed',
        attempts: 10,
        successfulCompletions: 10,
        bestPerformanceRating: 5,
        lastCompletedAt: '2026-07-20T00:00:00.000Z',
      })],
    }));
    const view = renderJourney().view;

    expect(view.getByText(`1 of ${catalogue.definitions.length} lessons complete`)).toBeTruthy();
    expect(view.getAllByText('Complete').length).toBeGreaterThan(0);
  });

  it('surfaces a loading state without a crash', () => {
    mockUseLessonLibraryData.mockReturnValue(contextValue({ loading: true }));
    const view = renderJourney().view;
    expect(view.getByRole('progressbar', { name: /Building your training journey/ })).toBeTruthy();
  });
});
