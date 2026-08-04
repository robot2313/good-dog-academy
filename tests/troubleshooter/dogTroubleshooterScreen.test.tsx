import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { sampleDog, sampleOwner } from '../../src/development/seed/sampleData';
import type { TroubleshooterAttempt } from '../../src/domain/models';
import { loadBundledLessonCatalogue } from '../../src/features/lessons/catalogue';
import { useLessonLibraryData } from '../../src/features/lessons/library/LessonLibraryContext';
import { DogTroubleshooterScreen } from '../../src/features/troubleshooter/DogTroubleshooterScreen';
import { troubleshooterHistoryService } from '../../src/features/troubleshooter/troubleshooterHistoryServiceInstance';
import type { RootStackParamList } from '../../src/types/navigation';

jest.mock('../../src/features/lessons/library/LessonLibraryContext', () => ({ useLessonLibraryData: jest.fn() }));
jest.mock('../../src/features/troubleshooter/troubleshooterHistoryServiceInstance', () => ({
  troubleshooterHistoryService: { listForDog: jest.fn(), recordOutcome: jest.fn() },
}));

const mockUseLessonLibraryData = jest.mocked(useLessonLibraryData);
const mockHistory = jest.mocked(troubleshooterHistoryService);
const catalogue = loadBundledLessonCatalogue();

describe('DogTroubleshooterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLessonLibraryData.mockReturnValue({
      catalogue,
      selectedDog: sampleDog,
      selectedOwnerId: sampleOwner.id,
      progressRecords: [],
      loading: false,
      error: null,
      retry: jest.fn(),
      completeLessonSession: jest.fn(),
    });
    mockHistory.listForDog.mockResolvedValue([]);
    mockHistory.recordOutcome.mockResolvedValue(savedAttempt());
  });

  it('asks short diagnostic questions and renders the complete practical plan before an optional lesson', async () => {
    const { view, navigate } = renderScreen();

    expect(view.getByRole('header', { name: `What is ${sampleDog.name} struggling with?` })).toBeTruthy();
    expect(view.getAllByRole('button')).toHaveLength(15);

    fireEvent.press(view.getByRole('button', { name: /Doesn't come when called/ }));
    fireEvent.press(view.getByRole('button', { name: 'Comes inside but not outdoors' }));
    fireEvent.press(view.getByRole('button', { name: 'Mostly relaxed and able to participate' }));
    fireEvent.press(view.getByRole('button', { name: 'Can eat and respond to an easy cue' }));
    fireEvent.changeText(view.getByLabelText('Where are you practising?'), 'quiet backyard');
    await waitFor(() => expect(view.getByRole('button', { name: 'Show my plan' }).props.accessibilityState.disabled).toBe(false));
    fireEvent.press(view.getByRole('button', { name: 'Show my plan' }));

    expect(view.getByRole('header', { name: /plan for: Doesn't come when called/ })).toBeTruthy();
    expect(view.getByRole('header', { name: 'What may be happening' })).toBeTruthy();
    expect(view.getByRole('header', { name: 'Change this first' })).toBeTruthy();
    expect(view.getByRole('header', { name: 'Try this now' })).toBeTruthy();
    expect(view.getByRole('header', { name: 'Success means' })).toBeTruthy();
    expect(view.getByRole('header', { name: 'If this does not help — level 2' })).toBeTruthy();
    expect(view.getByRole('header', { name: 'If it still does not help — level 3' })).toBeTruthy();
    expect(view.getByRole('header', { name: 'Why this recommendation was chosen' })).toBeTruthy();
    expect(view.getByRole('header', { name: 'How did this level go?' })).toBeTruthy();
    expect(view.getByText('Short-Distance Recall')).toBeTruthy();

    fireEvent.press(view.getByRole('button', { name: /^Short-Distance Recall\./ }));
    expect(navigate).toHaveBeenCalledWith('LessonSummary', { lessonId: 'recall-short-distance' });
  });

  it('shows a safety override immediately for panic or aggression without exposing the exercise', async () => {
    const { view } = renderScreen();
    await waitFor(() => expect(mockHistory.listForDog).toHaveBeenCalledWith(sampleDog.id));

    fireEvent.press(view.getByRole('button', { name: /Lunges or reacts intensely/ }));
    fireEvent.press(view.getByRole('button', { name: 'Reacts when dogs appear' }));
    fireEvent.press(view.getByRole('button', { name: 'Panicking, lunging, growling, or snapping' }));

    expect(view.getByRole('header', { name: 'Training stops here for safety' })).toBeTruthy();
    expect(view.getByText(/Do not punish growling/)).toBeTruthy();
    expect(view.queryByRole('header', { name: 'Try this now' })).toBeNull();
    expect(view.queryByRole('header', { name: 'Related lesson — optional' })).toBeNull();
  });

  it('provides a practical safety, equipment, reward, stress, and professional-help reference', async () => {
    const { view } = renderScreen();
    await waitFor(() => expect(mockHistory.listForDog).toHaveBeenCalledWith(sampleDog.id));

    fireEvent.press(view.getByRole('button', { name: /Training safety and practical guide/ }));

    expect(view.getByRole('header', { name: 'Equipment guide' })).toBeTruthy();
    expect(view.getByRole('header', { name: 'Reward guide' })).toBeTruthy();
    expect(view.getByRole('header', { name: 'Stress and body language' })).toBeTruthy();
    expect(view.getByRole('header', { name: 'Choosing professional help' })).toBeTruthy();
    expect(view.getByText(/A muzzle does not make close exposure safe/)).toBeTruthy();
    expect(view.getByText(/Do not punish it/)).toBeTruthy();
  });

  it('saves an outcome and immediately advances to fallback level two after no change', async () => {
    const { view } = renderScreen();
    await reachRecallResult(view);

    fireEvent.press(view.getByRole('button', { name: 'Report result: No change' }));

    await waitFor(() => expect(mockHistory.recordOutcome).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: sampleOwner.id,
      dogId: sampleDog.id,
      outcome: 'no-change',
    })));
    await waitFor(() => expect(view.getByText(/moved to the next fallback level/i)).toBeTruthy());
    expect(view.getByText('PERSONALISED PLAN · LEVEL 2')).toBeTruthy();
  });

  it('returns to concern selection without changing lesson progress', async () => {
    const { view } = renderScreen();
    await waitFor(() => expect(mockHistory.listForDog).toHaveBeenCalledWith(sampleDog.id));

    fireEvent.press(view.getByRole('button', { name: /Pulls on the lead/ }));
    fireEvent.press(view.getByRole('button', { name: 'Previous' }));

    expect(view.getByRole('header', { name: `What is ${sampleDog.name} struggling with?` })).toBeTruthy();
    expect(mockUseLessonLibraryData().progressRecords).toHaveLength(0);
  });
});

async function reachRecallResult(view: ReturnType<typeof render>) {
  fireEvent.press(view.getByRole('button', { name: /Doesn't come when called/ }));
  fireEvent.press(view.getByRole('button', { name: 'Comes inside but not outdoors' }));
  fireEvent.press(view.getByRole('button', { name: 'Mostly relaxed and able to participate' }));
  fireEvent.press(view.getByRole('button', { name: 'Can eat and respond to an easy cue' }));
  fireEvent.changeText(view.getByLabelText('Where are you practising?'), 'quiet backyard');
  await waitFor(() => expect(view.getByRole('button', { name: 'Show my plan' }).props.accessibilityState.disabled).toBe(false));
  fireEvent.press(view.getByRole('button', { name: 'Show my plan' }));
}

function renderScreen() {
  const navigate = jest.fn();
  const goBack = jest.fn();
  const props = {
    navigation: { navigate, goBack },
    route: { key: 'troubleshooter', name: 'Troubleshooter', params: undefined },
  } as unknown as NativeStackScreenProps<RootStackParamList, 'Troubleshooter'>;
  return { navigate, goBack, view: render(<DogTroubleshooterScreen {...props} />) };
}

function savedAttempt(): TroubleshooterAttempt {
  return {
    id: 'attempt-screen', ownerId: sampleOwner.id, dogId: sampleDog.id, topicId: 'recall', scenarioId: 'recall-inside-not-outside',
    failureCategory: 'not_generalised', protocolId: 'recall-reset', protocolVersion: 1, fallbackLevel: 1,
    outcome: 'no-change', environment: 'quiet backyard', createdAt: '2026-08-04T00:00:00.000Z',
  };
}
