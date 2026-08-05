import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { User } from '@supabase/supabase-js';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { AccountScreen } from '../../src/features/account/AccountScreen';
import { useAuth } from '../../src/features/account/AuthContext';
import { useTeamDog } from '../../src/features/account/TeamDogContext';
import { useOnboarding } from '../../src/features/onboarding/OnboardingContext';
import { cloudHouseholdService } from '../../src/services/cloud/CloudHouseholdService';
import { localCloudBackupService } from '../../src/services/cloud/LocalCloudBackupService';
import type { RootStackParamList } from '../../src/types/navigation';

jest.mock('../../src/features/account/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../src/features/account/TeamDogContext', () => ({ useTeamDog: jest.fn() }));
jest.mock('../../src/features/onboarding/OnboardingContext', () => ({ useOnboarding: jest.fn() }));
jest.mock('../../src/services/cloud/CloudHouseholdService', () => ({ cloudHouseholdService: {
  ensureHousehold: jest.fn(),
  listMembers: jest.fn().mockResolvedValue([]),
  listActivity: jest.fn().mockResolvedValue([]),
  listInvitations: jest.fn().mockResolvedValue([]),
  createInvitation: jest.fn(),
  acceptInvitation: jest.fn(),
  updateMemberRole: jest.fn(),
  removeMember: jest.fn(),
} }));
jest.mock('../../src/services/cloud/LocalCloudBackupService', () => ({ localCloudBackupService: { backup: jest.fn() } }));

const mockUseAuth = jest.mocked(useAuth);
const mockUseTeamDog = jest.mocked(useTeamDog);
const mockUseOnboarding = jest.mocked(useOnboarding);
const mockEnsureHousehold = jest.mocked(cloudHouseholdService.ensureHousehold);
const mockListMembers = jest.mocked(cloudHouseholdService.listMembers);
const mockUpdateMemberRole = jest.mocked(cloudHouseholdService.updateMemberRole);
const mockBackup = jest.mocked(localCloudBackupService.backup);

function renderScreen() {
  const props = {
    navigation: { goBack: jest.fn() },
    route: { key: 'account', name: 'Account' },
  } as unknown as NativeStackScreenProps<RootStackParamList, 'Account'>;
  return render(<AccountScreen {...props} />);
}

describe('AccountScreen', () => {
  const signIn = jest.fn();
  const signUp = jest.fn();
  const signOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOnboarding.mockReturnValue({
      status: {
        state: 'complete',
        owner: { displayName: 'Taylor', email: 'taylor@example.com' },
        dog: { name: 'Pepper' },
      },
    } as unknown as ReturnType<typeof useOnboarding>);
    mockUseTeamDog.mockReturnValue({
      household: null,
      syncStatus: 'off',
      lastResult: null,
      lastSyncedAt: null,
      enableSync: jest.fn().mockResolvedValue({ pushed: 0, pulled: 0 }),
      syncNow: jest.fn(),
      refreshHousehold: jest.fn().mockResolvedValue(null),
    });
  });

  it('signs in without uploading local data automatically', async () => {
    mockUseAuth.mockReturnValue({ status: 'signed-out', user: null, session: null, signIn, signUp, signOut });
    const view = renderScreen();

    fireEvent.changeText(view.getByLabelText('Password'), 'secret1');
    fireEvent.press(view.getByRole('button', { name: 'Sign In Securely' }));

    await waitFor(() => expect(signIn).toHaveBeenCalledWith('taylor@example.com', 'secret1'));
    expect(mockBackup).not.toHaveBeenCalled();
  });

  it('only backs up after the signed-in owner presses the explicit backup button', async () => {
    const user = { id: 'user-1', email: 'taylor@example.com' } as User;
    mockUseAuth.mockReturnValue({ status: 'signed-in', user, session: {} as never, signIn, signUp, signOut } as ReturnType<typeof useAuth>);
    mockEnsureHousehold.mockResolvedValue({
      id: 'house-1', name: "Pepper's Team", role: 'owner', created_at: '', created_by: 'user-1', updated_at: '',
    });
    mockBackup.mockResolvedValue(12);
    const view = renderScreen();

    expect(mockBackup).not.toHaveBeenCalled();
    fireEvent.press(view.getByRole('button', { name: 'Create My Team and Sync' }));

    await waitFor(() => expect(mockBackup).toHaveBeenCalledWith('house-1', user));
    expect(await view.findByText(/12 local records are protected/i)).toBeTruthy();
  });

  it('lets an owner change a member between trainer and viewer', async () => {
    const user = { id: 'user-1', email: 'taylor@example.com' } as User;
    const household = {
      id: 'house-1', name: "Pepper's Team", role: 'owner' as const,
      created_at: '', created_by: 'user-1', updated_at: '',
    };
    mockUseAuth.mockReturnValue({ status: 'signed-in', user, session: {} as never, signIn, signUp, signOut } as ReturnType<typeof useAuth>);
    mockUseTeamDog.mockReturnValue({
      household,
      syncStatus: 'idle',
      lastResult: null,
      lastSyncedAt: null,
      enableSync: jest.fn(),
      syncNow: jest.fn(),
      refreshHousehold: jest.fn().mockResolvedValue(household),
    });
    mockListMembers.mockResolvedValue([{
      household_id: 'house-1', user_id: 'user-2', role: 'trainer', invited_by: 'user-1', joined_at: '', displayName: 'Jordan',
    }]);
    mockUpdateMemberRole.mockResolvedValue();
    const view = renderScreen();

    fireEvent.press(await view.findByRole('button', { name: 'Make Jordan a Viewer' }));

    await waitFor(() => expect(mockUpdateMemberRole).toHaveBeenCalledWith('house-1', 'user-2', 'viewer'));
  });
});
