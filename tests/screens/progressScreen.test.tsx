import type { ComponentProps } from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { sampleBehaviourProfile, sampleDog, sampleOwner } from '../../src/development/seed/sampleData';
import { useLessonLibraryData } from '../../src/features/lessons/library/LessonLibraryContext';
import { useOnboarding } from '../../src/features/onboarding/OnboardingContext';
import { ProgressScreen } from '../../src/screens/ProgressScreen';

jest.mock('../../src/features/onboarding/OnboardingContext', () => ({ useOnboarding: jest.fn() }));
jest.mock('../../src/features/lessons/library/LessonLibraryContext', () => ({ useLessonLibraryData: jest.fn() }));

const mockUseOnboarding = jest.mocked(useOnboarding);
const mockUseLessonLibraryData = jest.mocked(useLessonLibraryData);

describe('ProgressScreen premium snapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOnboarding.mockReturnValue({
      status: {
        state: 'complete',
        hasSavedData: true,
        owner: sampleOwner,
        dog: { ...sampleDog, name: 'Pepper' },
        behaviourProfile: sampleBehaviourProfile,
      },
    } as ReturnType<typeof useOnboarding>);
    mockUseLessonLibraryData.mockReturnValue({
      progressRecords: [
        { status: 'completed', attempts: 3 },
        { status: 'inProgress', attempts: 2 },
        { status: 'available', attempts: 0 },
      ],
    } as unknown as ReturnType<typeof useLessonLibraryData>);
  });

  it('shows a dog-specific training snapshot and preserves navigation actions', () => {
    const navigate = jest.fn();
    const props = {
      navigation: { navigate },
      route: { key: 'progress', name: 'Progress' },
    } as unknown as ComponentProps<typeof ProgressScreen>;

    const view = render(<ProgressScreen {...props} />);

    expect(view.getByRole('header', { name: "Pepper's momentum" })).toBeTruthy();
    expect(view.getByLabelText('Completed: 1')).toBeTruthy();
    expect(view.getByLabelText('In progress: 1')).toBeTruthy();
    expect(view.getByLabelText('Sessions: 5')).toBeTruthy();

    fireEvent.press(view.getByRole('button', { name: 'View session history' }));
    expect(navigate).toHaveBeenCalledWith('SessionHistory');
  });
});
