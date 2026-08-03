import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { loadBundledLessonCatalogue } from '../../src/features/lessons/catalogue';
import { useLessonLibraryData } from '../../src/features/lessons/library/LessonLibraryContext';
import { LessonSessionScreen } from '../../src/features/lessons/session/LessonSessionScreen';
import type { RootStackParamList } from '../../src/types/navigation';

jest.mock('../../src/features/lessons/library/LessonLibraryContext', () => ({
  useLessonLibraryData: jest.fn(),
}));

const mockUseLibrary = jest.mocked(useLessonLibraryData);
const catalogue = loadBundledLessonCatalogue();
const lessonId = 'recall-name-response';

function contextValue(completeLessonSession: jest.Mock) {
  return {
    catalogue,
    selectedDog: { id: 'dog-1', name: 'Milo', photoUri: null },
    selectedOwnerId: 'owner-1',
    progressRecords: [],
    loading: false,
    error: null,
    retry: jest.fn(),
    completeLessonSession,
  } as unknown as ReturnType<typeof useLessonLibraryData>;
}

function renderSession() {
  const navigate = jest.fn();
  const goBack = jest.fn();
  const props = {
    navigation: { navigate, goBack },
    route: { key: 'session', name: 'LessonSession', params: { lessonId } },
  } as unknown as NativeStackScreenProps<RootStackParamList, 'LessonSession'>;
  return { navigate, goBack, view: render(<LessonSessionScreen {...props} />) };
}

async function driveToSave(view: ReturnType<typeof renderSession>['view']) {
  fireEvent.press(await view.findByRole('button', { name: 'Start Lesson' }));
  fireEvent.press(await view.findByRole('button', { name: 'Complete Lesson' }));
  fireEvent.press(await view.findByRole('button', { name: /^5 out of 5/ }));
  fireEvent.press(view.getByRole('button', { name: 'Save session' }));
}

describe('lesson completion navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('saves before navigating Home and passes the celebration as a one-time param', async () => {
    const order: string[] = [];
    const completeLessonSession = jest.fn(async () => {
      order.push('save');
      return { progressRecords: [] };
    });
    mockUseLibrary.mockReturnValue(contextValue(completeLessonSession));

    const { view, navigate } = renderSession();
    navigate.mockImplementation(() => { order.push('navigate'); });
    await driveToSave(view);

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    expect(completeLessonSession).toHaveBeenCalledTimes(1);
    // Save must happen before navigation.
    expect(order).toEqual(['save', 'navigate']);
    expect(navigate).toHaveBeenCalledWith('Main', {
      screen: 'Today',
      params: { celebrateLessonId: lessonId, celebrateLessonTitle: 'Name Response' },
    });
  });

  it('does not navigate or celebrate when saving fails', async () => {
    const completeLessonSession = jest.fn(async () => {
      throw new Error('save failed');
    });
    mockUseLibrary.mockReturnValue(contextValue(completeLessonSession));

    const { view, navigate } = renderSession();
    await driveToSave(view);

    expect(await view.findByText(/could not be saved/i)).toBeTruthy();
    expect(navigate).not.toHaveBeenCalled();
  });
});
