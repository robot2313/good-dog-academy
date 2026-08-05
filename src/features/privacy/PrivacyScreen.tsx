import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { InlineValidationMessage } from '../../components/InlineValidationMessage';
import { LessonActionBar } from '../../components/LessonActionBar';
import { LessonScaffold } from '../../components/LessonScaffold';
import { useOnboarding } from '../onboarding/OnboardingContext';
import { colors } from '../../theme/colors';
import { colorTokens, spacingTokens } from '../../theme/tokens';
import type { RootStackParamList } from '../../types/navigation';
import { localDataDeletionService } from './localDataDeletionServiceInstance';

export const PRIVACY_CONTACT_EMAIL = 'GoodDogAcademy1@gmail.com';

type Props = NativeStackScreenProps<RootStackParamList, 'Privacy'>;

export function PrivacyScreen({ navigation }: Props): React.JSX.Element {
  const { resetAfterLocalDataClear } = useOnboarding();
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const deleteAllData = async (): Promise<void> => {
    setDeleting(true);
    setErrorMessage(null);
    try {
      const result = await localDataDeletionService.deleteAllLocalData();
      resetAfterLocalDataClear();
      Alert.alert(
        'Local app data deleted',
        result.managedPhotosRemoved
          ? 'Your saved Good Dog Academy data and managed dog photo have been removed from this device.'
          : `Your saved training data was deleted, but a managed photo file could not be removed. Contact ${PRIVACY_CONTACT_EMAIL} if you need help.`,
      );
    } catch {
      setErrorMessage('Your app data could not be deleted safely. Current app state was kept. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeletion = (): void => {
    Alert.alert(
      'Delete all local app data?',
      'This permanently deletes the owner and dog profile, optional dog photo, assessment answers, lesson progress, plans, training sessions, achievements, and settings saved on this device. Any Team Dog cloud backup is kept. The app will return to Welcome.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete All Local Data', style: 'destructive', onPress: () => void deleteAllData() },
      ],
    );
  };

  return (
    <LessonScaffold
      footer={<LessonActionBar back={{ label: 'Back', onPress: navigation.goBack }} />}
    >
      <View style={screenStyles.header}>
        <Text accessibilityRole="header" style={screenStyles.title}>Privacy and Your Data</Text>
        <Text style={screenStyles.intro}>Good Dog Academy is designed to keep your training data private and under your control.</Text>
      </View>

      <View style={screenStyles.card}>
        <Text style={screenStyles.heading}>Data stored on this device</Text>
        <Text style={screenStyles.body}>The app stores your owner name, dog profile and optional photo, behaviour assessment answers, lesson progress, plans, training sessions, achievements, and settings locally on this device.</Text>
        <Text style={screenStyles.body}>Your selected dog photo is copied into app-managed storage on this device. Training data stays local unless you create a Team Dog account and explicitly choose to back it up; dog photos are not included in cloud backup.</Text>
      </View>

      <View style={screenStyles.card}>
        <Text style={screenStyles.heading}>Optional Team Dog cloud data</Text>
        <Text style={screenStyles.body}>If you enable Team Dog, your account name, training records, household roles, invitation email addresses and codes, and shared activity are stored securely in the Sydney region. Dog photo files and local photo paths are not uploaded.</Text>
        <Text style={screenStyles.body}>Household owners and trainers can update shared training records. Viewers can only read them. Only the intended signed-in email can accept an unexpired invitation code.</Text>
      </View>

      <View style={screenStyles.card}>
        <Text style={screenStyles.heading}>Questions or privacy help</Text>
        <Text style={screenStyles.body}>Contact us to request deletion of your Team Dog account or cloud data.</Text>
        <Text selectable style={screenStyles.email}>{PRIVACY_CONTACT_EMAIL}</Text>
      </View>

      <View style={screenStyles.dangerCard}>
        <Text style={screenStyles.heading}>Delete local app data</Text>
        <Text style={screenStyles.body}>This permanently clears this phone. It does not delete a Team Dog cloud backup.</Text>
        <AppButton
          title={deleting ? 'Deleting Local Data…' : 'Delete All Local Data'}
          accessibilityLabel="Delete All Local Data"
          variant="destructive"
          loading={deleting}
          onPress={confirmDeletion}
        />
        <InlineValidationMessage message={errorMessage} />
      </View>
    </LessonScaffold>
  );
}

const screenStyles = StyleSheet.create({
  header: { gap: spacingTokens.sm },
  title: { color: colors.text, fontSize: 30, lineHeight: 36, fontWeight: '900' },
  intro: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  card: { gap: spacingTokens.sm, padding: spacingTokens.lg, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  dangerCard: { gap: spacingTokens.md, padding: spacingTokens.lg, borderRadius: 20, borderWidth: 1, borderColor: '#D9B0A9', backgroundColor: colorTokens.status.errorSurface },
  heading: { color: colors.text, fontSize: 20, lineHeight: 26, fontWeight: '900' },
  body: { color: colors.text, fontSize: 15, lineHeight: 23 },
  email: { color: colors.gold, fontSize: 16, lineHeight: 23, fontWeight: '800' },
});
