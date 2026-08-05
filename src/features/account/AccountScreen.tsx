import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { FormTextInput } from '../../components/FormTextInput';
import { InlineValidationMessage } from '../../components/InlineValidationMessage';
import { LessonActionBar } from '../../components/LessonActionBar';
import { LessonScaffold } from '../../components/LessonScaffold';
import { PremiumCard } from '../../components/PremiumCard';
import { SectionHeader } from '../../components/SectionHeader';
import {
  cloudHouseholdService,
  type CloudHousehold,
  type TeamDogActivity,
  type TeamDogInvitation,
  type TeamDogMember,
} from '../../services/cloud/CloudHouseholdService';
import { localCloudBackupService } from '../../services/cloud/LocalCloudBackupService';
import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '../../theme/tokens';
import type { RootStackParamList } from '../../types/navigation';
import { useOnboarding } from '../onboarding/OnboardingContext';
import { useAuth } from './AuthContext';
import { useTeamDog } from './TeamDogContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Account'>;
type AuthMode = 'sign-in' | 'create';
type InviteRole = 'trainer' | 'viewer';

function messageFromError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Something went wrong. Please try again.';
}

function activityText(item: TeamDogActivity): string {
  if (item.action === 'member_joined') return `${item.actorName} joined the team`;
  const subject = item.entity_type?.replaceAll('_', ' ') ?? 'training record';
  if (item.action === 'record_created') return `${item.actorName} added ${subject}`;
  if (item.action === 'record_deleted') return `${item.actorName} removed ${subject}`;
  if (item.action === 'role_changed') return `${item.actorName} changed a team role`;
  return `${item.actorName} updated ${subject}`;
}

export function AccountScreen({ navigation }: Props): React.JSX.Element {
  const auth = useAuth();
  const teamDog = useTeamDog();
  const { status: onboardingStatus } = useOnboarding();
  const owner = onboardingStatus && 'owner' in onboardingStatus ? onboardingStatus.owner : null;
  const dog = onboardingStatus && 'dog' in onboardingStatus ? onboardingStatus.dog : null;
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState(owner?.email ?? '');
  const [password, setPassword] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<InviteRole>('trainer');
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [members, setMembers] = useState<readonly TeamDogMember[]>([]);
  const [invitations, setInvitations] = useState<readonly TeamDogInvitation[]>([]);
  const [activity, setActivity] = useState<readonly TeamDogActivity[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTeamDetails = useCallback(async (team: CloudHousehold): Promise<void> => {
    const [nextMembers, nextActivity, nextInvitations] = await Promise.all([
      cloudHouseholdService.listMembers(team.id),
      cloudHouseholdService.listActivity(team.id),
      team.role === 'owner' ? cloudHouseholdService.listInvitations(team.id) : Promise.resolve([]),
    ]);
    setMembers(nextMembers);
    setActivity(nextActivity);
    setInvitations(nextInvitations);
  }, []);

  useEffect(() => {
    if (auth.status !== 'signed-in') return;
    let active = true;
    void teamDog.refreshHousehold().then((team) => {
      if (active && team) return loadTeamDetails(team);
    }).catch((cause) => {
      if (active) setError(messageFromError(cause));
    });
    return () => { active = false; };
  }, [auth.status, loadTeamDetails, teamDog.refreshHousehold]);

  const submitAuthentication = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === 'create') {
        const result = await auth.signUp(email, password, owner?.displayName ?? 'Dog guardian');
        setMessage(result === 'confirmation-required'
          ? 'Check your email, confirm the account, then return here to sign in.'
          : 'Your secure Team Dog account is ready.');
      } else {
        await auth.signIn(email, password);
        setMessage('Signed in securely. Your local training data has not uploaded.');
      }
    } catch (cause) {
      setError(messageFromError(cause));
    } finally {
      setBusy(false);
    }
  };

  const ensureOwnHousehold = async (): Promise<CloudHousehold> => {
    if (!auth.user) throw new Error('Please sign in first.');
    const team = teamDog.household ?? await cloudHouseholdService.ensureHousehold(
      auth.user,
      owner?.displayName ?? 'Dog guardian',
      dog?.name ?? 'My Dog',
    );
    return team;
  };

  const backupAndEnableSync = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (!auth.user) throw new Error('Please sign in first.');
      const team = await ensureOwnHousehold();
      const count = await localCloudBackupService.backup(team.id, auth.user);
      await teamDog.enableSync(team);
      await loadTeamDetails(team);
      setMessage(`${count} local records are protected. Team Dog syncing is now on.`);
    } catch (cause) {
      setError(messageFromError(cause));
    } finally {
      setBusy(false);
    }
  };

  const connectThisDevice = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const team = teamDog.household;
      if (!team) throw new Error('No Team Dog household was found.');
      const result = await teamDog.enableSync(team);
      await loadTeamDetails(team);
      setMessage(`Sync complete: ${result.pulled} received and ${result.pushed} sent.`);
    } catch (cause) {
      setError(messageFromError(cause));
    } finally {
      setBusy(false);
    }
  };

  const createInvite = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (!auth.user) throw new Error('Please sign in first.');
      const team = await ensureOwnHousehold();
      const invitation = await cloudHouseholdService.createInvitation(
        team.id,
        auth.user.id,
        inviteEmail,
        inviteRole,
      );
      setInviteCode(invitation.invite_code);
      setInviteEmail('');
      await loadTeamDetails(team);
      setMessage(`Invite ready for ${invitation.invited_email}. It expires in 7 days.`);
    } catch (cause) {
      setError(messageFromError(cause));
    } finally {
      setBusy(false);
    }
  };

  const acceptInvite = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (!auth.user) throw new Error('Please sign in first.');
      if (onboardingStatus?.hasSavedData) {
        throw new Error('This phone already has local dog data. To prevent mixing two dogs, join from a fresh device or keep this phone in its current Team Dog household.');
      }
      const team = await cloudHouseholdService.acceptInvitation(
        auth.user,
        owner?.displayName ?? 'Dog guardian',
        joinCode,
      );
      const result = await teamDog.enableSync(team);
      await loadTeamDetails(team);
      setJoinCode('');
      setMessage(`Welcome to ${team.name}. ${result.pulled} records were added to this phone.`);
    } catch (cause) {
      setError(messageFromError(cause));
    } finally {
      setBusy(false);
    }
  };

  const syncNow = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const result = await teamDog.syncNow();
      if (teamDog.household) await loadTeamDetails(teamDog.household);
      setMessage(`Up to date: ${result.pulled} received and ${result.pushed} sent.`);
    } catch (cause) {
      setError(messageFromError(cause));
    } finally {
      setBusy(false);
    }
  };

  const changeMemberRole = async (member: TeamDogMember, role: InviteRole): Promise<void> => {
    if (!teamDog.household) return;
    setBusy(true);
    setError(null);
    try {
      await cloudHouseholdService.updateMemberRole(teamDog.household.id, member.user_id, role);
      await loadTeamDetails(teamDog.household);
      setMessage(`${member.displayName} is now a ${role}.`);
    } catch (cause) {
      setError(messageFromError(cause));
    } finally {
      setBusy(false);
    }
  };

  const confirmRemoveMember = (member: TeamDogMember): void => {
    if (!teamDog.household) return;
    Alert.alert(
      `Remove ${member.displayName}?`,
      'They will lose access to this Team Dog household and its shared training data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const currentTeam = teamDog.household;
            if (!currentTeam) return;
            setBusy(true);
            void cloudHouseholdService.removeMember(currentTeam.id, member.user_id)
              .then(() => loadTeamDetails(currentTeam))
              .then(() => setMessage(`${member.displayName} was removed from Team Dog.`))
              .catch((cause: unknown) => setError(messageFromError(cause)))
              .finally(() => setBusy(false));
          },
        },
      ],
    );
  };

  const signOut = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await auth.signOut();
      setMembers([]);
      setInvitations([]);
      setActivity([]);
      setMessage('Signed out. Local app data remains on this phone.');
    } catch (cause) {
      setError(messageFromError(cause));
    } finally {
      setBusy(false);
    }
  };

  const team = teamDog.household;

  return (
    <LessonScaffold footer={<LessonActionBar back={{ label: 'Back', onPress: navigation.goBack }} />}>
      <View style={screenStyles.hero}>
        <Text style={screenStyles.eyebrow}>TEAM DOG</Text>
        <Text accessibilityRole="header" style={screenStyles.title}>One team around your dog</Text>
        <Text style={screenStyles.intro}>Protect progress across phones and give every family member or trainer the right level of access.</Text>
      </View>

      {auth.status === 'unavailable' ? (
        <PremiumCard tone="elevated">
          <SectionHeader title="Cloud accounts are not available in this build" supportingText="The app and all local training features still work normally." />
        </PremiumCard>
      ) : auth.status === 'loading' ? (
        <PremiumCard><Text style={screenStyles.body}>Checking your secure account...</Text></PremiumCard>
      ) : auth.status === 'signed-out' ? (
        <PremiumCard tone="elevated">
          <SectionHeader
            eyebrow={mode === 'create' ? 'CREATE ACCOUNT' : 'WELCOME BACK'}
            title={mode === 'create' ? 'Protect your training journey' : 'Sign in to Team Dog'}
            supportingText="Signing in never uploads this phone's data automatically."
          />
          <View style={screenStyles.buttonGroup}>
            <AppButton title="Sign In" variant={mode === 'sign-in' ? 'primary' : 'secondary'} onPress={() => setMode('sign-in')} />
            <AppButton title="Create Account" variant={mode === 'create' ? 'primary' : 'secondary'} onPress={() => setMode('create')} />
          </View>
          <FormTextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" />
          <FormTextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry textContentType={mode === 'create' ? 'newPassword' : 'password'} />
          <AppButton title={mode === 'create' ? 'Create Secure Account' : 'Sign In Securely'} onPress={() => void submitAuthentication()} disabled={!email.trim() || password.length < 6} loading={busy} />
          <InlineValidationMessage message={error} />
          {message ? <Text accessibilityLiveRegion="polite" style={screenStyles.success}>{message}</Text> : null}
        </PremiumCard>
      ) : (
        <>
          <PremiumCard tone="forest">
            <SectionHeader inverse eyebrow="SIGNED IN" title={team?.name ?? auth.user?.email ?? 'Team Dog account'} supportingText={team ? `Your role: ${team.role}` : 'Join an existing team or start your own.'} />
          </PremiumCard>

          {!team ? (
            <>
              <PremiumCard tone="elevated">
                <SectionHeader eyebrow="HAVE AN INVITE?" title="Join your dog's existing team" supportingText="Sign in with the same email your invitation was created for." />
                <FormTextInput label="Invite code" value={joinCode} onChangeText={setJoinCode} autoCapitalize="characters" autoCorrect={false} maxLength={12} />
                <AppButton title="Join Team Dog" onPress={() => void acceptInvite()} disabled={joinCode.trim().length !== 12} loading={busy} />
              </PremiumCard>
              <PremiumCard>
                <SectionHeader eyebrow="START A TEAM" title="Protect this phone's training journey" supportingText="This creates your own Team Dog household, backs up local records, and turns on secure sync." />
                <AppButton title="Create My Team and Sync" onPress={() => void backupAndEnableSync()} loading={busy} />
              </PremiumCard>
            </>
          ) : (
            <>
              <PremiumCard tone="elevated">
                <SectionHeader eyebrow="LIVE SYNC" title="Training stays together" supportingText="Changes update between connected phones. Device-only dog photos remain private on each phone." />
                <Text style={screenStyles.syncState}>Status: {teamDog.syncStatus === 'syncing' ? 'Syncing now' : teamDog.syncStatus === 'error' ? 'Needs attention' : 'Connected'}</Text>
                <AppButton title={teamDog.syncStatus === 'off' ? 'Connect This Device' : 'Sync Now'} onPress={() => void (teamDog.syncStatus === 'off' ? connectThisDevice() : syncNow())} loading={busy} />
              </PremiumCard>

              {team.role === 'owner' ? (
                <PremiumCard>
                  <SectionHeader eyebrow="INVITE" title="Add someone you trust" supportingText="The code only works for the email below and expires after 7 days." />
                  <FormTextInput label="Their email" value={inviteEmail} onChangeText={setInviteEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
                  <View style={screenStyles.buttonGroup}>
                    <AppButton title="Trainer" variant={inviteRole === 'trainer' ? 'primary' : 'secondary'} onPress={() => setInviteRole('trainer')} />
                    <AppButton title="Viewer" variant={inviteRole === 'viewer' ? 'primary' : 'secondary'} onPress={() => setInviteRole('viewer')} />
                  </View>
                  <AppButton title="Create Invite Code" onPress={() => void createInvite()} disabled={!inviteEmail.includes('@')} loading={busy} />
                  {inviteCode ? (
                    <View accessibilityLabel={`Invite code ${inviteCode}`} style={screenStyles.inviteCode}>
                      <Text style={screenStyles.inviteCodeLabel}>SHARE THIS CODE</Text>
                      <Text selectable style={screenStyles.inviteCodeValue}>{inviteCode}</Text>
                    </View>
                  ) : null}
                  {invitations.map((invitation) => (
                    <Text key={invitation.id} style={screenStyles.supporting}>Pending: {invitation.invited_email} · {invitation.role}</Text>
                  ))}
                </PremiumCard>
              ) : null}

              <PremiumCard>
                <SectionHeader eyebrow="PEOPLE" title="Your Team Dog" />
                {members.map((member) => (
                  <View key={member.user_id} style={screenStyles.memberBlock}>
                    <View style={screenStyles.listRow}>
                      <Text style={screenStyles.listTitle}>{member.displayName}</Text>
                      <Text style={screenStyles.role}>{member.role.toUpperCase()}</Text>
                    </View>
                    {team.role === 'owner' && member.role !== 'owner' ? (
                      <View style={screenStyles.buttonGroup}>
                        <AppButton
                          title={member.role === 'trainer' ? 'Make Viewer' : 'Make Trainer'}
                          accessibilityLabel={`Make ${member.displayName} a ${member.role === 'trainer' ? 'Viewer' : 'Trainer'}`}
                          variant="secondary"
                          disabled={busy}
                          onPress={() => void changeMemberRole(member, member.role === 'trainer' ? 'viewer' : 'trainer')}
                        />
                        <AppButton title="Remove From Team" accessibilityLabel={`Remove ${member.displayName} from Team Dog`} variant="destructive" disabled={busy} onPress={() => confirmRemoveMember(member)} />
                      </View>
                    ) : null}
                  </View>
                ))}
              </PremiumCard>

              <PremiumCard>
                <SectionHeader eyebrow="RECENT ACTIVITY" title="Who changed what" supportingText="Cloud changes are attributed to the signed-in team member." />
                {activity.length === 0 ? <Text style={screenStyles.supporting}>No shared activity yet.</Text> : activity.map((item) => (
                  <View key={item.id} style={screenStyles.activityRow}>
                    <Text style={screenStyles.listTitle}>{activityText(item)}</Text>
                    <Text style={screenStyles.supporting}>{new Date(item.occurred_at).toLocaleString()}</Text>
                  </View>
                ))}
              </PremiumCard>
            </>
          )}

          <AppButton title="Sign Out" variant="ghost" onPress={() => void signOut()} disabled={busy} />
          <InlineValidationMessage message={error} />
          {message ? <Text accessibilityLiveRegion="polite" style={screenStyles.success}>{message}</Text> : null}
        </>
      )}
    </LessonScaffold>
  );
}

const screenStyles = StyleSheet.create({
  hero: { gap: spacingTokens.sm, paddingVertical: spacingTokens.sm },
  eyebrow: { ...typographyTokens.label, color: colorTokens.brand.primary, letterSpacing: 1.2 },
  title: { ...typographyTokens.pageTitle, color: colorTokens.text.primary },
  intro: { ...typographyTokens.body, color: colorTokens.text.secondary },
  body: { ...typographyTokens.supporting, color: colorTokens.text.primary },
  supporting: { ...typographyTokens.supporting, color: colorTokens.text.secondary },
  buttonGroup: { gap: spacingTokens.sm },
  success: { ...typographyTokens.supporting, color: colorTokens.status.successText, fontWeight: '700' },
  syncState: { ...typographyTokens.supporting, color: colorTokens.brand.primary, fontWeight: '800' },
  inviteCode: { gap: spacingTokens.xs, alignItems: 'center', borderRadius: radiusTokens.lg, padding: spacingTokens.lg, backgroundColor: colorTokens.background.subtle },
  inviteCodeLabel: { ...typographyTokens.label, color: colorTokens.text.secondary, letterSpacing: 1 },
  inviteCodeValue: { color: colorTokens.brand.primary, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: 2 },
  listRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacingTokens.sm, paddingVertical: spacingTokens.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colorTokens.border.subtle },
  memberBlock: { gap: spacingTokens.sm, paddingBottom: spacingTokens.sm },
  listTitle: { ...typographyTokens.body, color: colorTokens.text.primary, fontWeight: '700', flex: 1 },
  role: { ...typographyTokens.label, color: colorTokens.brand.primary },
  activityRow: { gap: spacingTokens.xxs, paddingVertical: spacingTokens.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colorTokens.border.subtle },
});
