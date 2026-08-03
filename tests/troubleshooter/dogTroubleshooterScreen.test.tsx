import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fireEvent, render } from '@testing-library/react-native';

import { sampleDog, sampleOwner } from '../../src/development/seed/sampleData';
import { loadBundledLessonCatalogue } from '../../src/features/lessons/catalogue';
import { useLessonLibraryData } from '../../src/features/lessons/library/LessonLibraryContext';
import { DogTroubleshooterScreen } from '../../src/features/troubleshooter/DogTroubleshooterScreen';
import type { RootStackParamList } from '../../src/types/navigation';

jest.mock('../../src/features/lessons/library/LessonLibraryContext', () => ({
  useLessonLibraryData: jest.fn(),
}));

const mockUseLessonLibraryData = jest.mocked(useLessonLibraryData);
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
  });

  it('shows understandable concerns, safety guidance, and real lesson recommendations', () => {
    const { view, navigate } = renderScreen();

    expect(view.getByRole('header', { name: `What is ${sampleDog.name} struggling with?` })).toBeTruthy();
    expect(view.getAllByRole('button')).toHaveLength(troubleshooterButtonCount());

    fireEvent.press(view.getByRole('button', { name: /Lunges or reacts intensely/ }));

    expect(view.getByRole('header', { name: `A training path for ${sampleDog.name}` })).toBeTruthy();
    expect(view.UNSAFE_getByProps({ accessibilityRole: 'alert' })).toBeTruthy();
    expect(view.getByText(/not a medical or behavioural diagnosis/)).toBeTruthy();
    expect(view.getByRole('header', { name: 'Best place to start' })).toBeTruthy();
    expect(view.getByText('Find a Safe Working Distance')).toBeTruthy();

    fireEvent.press(view.getByRole('button', { name: /^Find a Safe Working Distance\./ }));
    expect(navigate).toHaveBeenCalledWith('LessonSummary', { lessonId: 'reactivity-safe-distance' });
  });

  it('returns to concern selection without changing saved progress', () => {
    const { view } = renderScreen();

    fireEvent.press(view.getByRole('button', { name: /Pulls on the lead/ }));
    fireEvent.press(view.getByRole('button', { name: 'Change problem' }));

    expect(view.getByRole('header', { name: `What is ${sampleDog.name} struggling with?` })).toBeTruthy();
    expect(mockUseLessonLibraryData().progressRecords).toHaveLength(0);
  });
});

function renderScreen() {
  const navigate = jest.fn();
  const goBack = jest.fn();
  const props = {
    navigation: { navigate, goBack },
    route: { key: 'troubleshooter', name: 'Troubleshooter', params: undefined },
  } as unknown as NativeStackScreenProps<RootStackParamList, 'Troubleshooter'>;
  return { navigate, goBack, view: render(<DogTroubleshooterScreen {...props} />) };
}

function troubleshooterButtonCount(): number {
  // Ten concern cards plus the pinned Back control.
  return 11;
}
