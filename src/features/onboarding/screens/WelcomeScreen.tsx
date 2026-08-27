import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../../../components/AppScreen';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryTextButton } from '../../../components/SecondaryTextButton';
import { InlineValidationMessage } from '../../../components/InlineValidationMessage';
import { LessonPhotoBanner } from '../../../components/LessonPhotoBanner';
import { ReferenceIcon } from '../../../components/ReferenceIcon';
import { referencePalette } from '../../../theme/referenceStyles';
import { styles } from '../../../theme/styles';
import type { RootStackParamList } from '../../../types/navigation';
import { useOnboarding } from '../OnboardingContext';
import { useState } from 'react';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props): React.JSX.Element {
  const { status, restartSavedSetup, recoveryError } = useOnboarding();
  const [confirmRestart, setConfirmRestart] = useState(false);

  const restart = async () => {
    if (await restartSavedSetup()) navigation.navigate('OwnerSetup');
  };

  return (
    <AppScreen>
      <View style={styles.welcomeMark} accessibilityLabel="Good Dog Academy logo">
        <Image source={require('../../../../assets/branding/app-mark.png')} resizeMode="contain" style={styles.welcomeMarkImage} />
      </View>
      <LessonPhotoBanner
        source={require('../../../../assets/lesson-images/by-lesson/confidence-choice-and-exploration.jpg')}
        accessibilityLabel="A relaxed dog exploring calmly with its owner"
      />
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>GOOD DOG ACADEMY</Text>
        <Text style={styles.heroTitle}>Raise an amazing dog.</Text>
        <Text style={styles.heroBody}>We'll create a personalised training plan for you and your dog.</Text>
      </View>
      <View style={welcomeLocal.pointList}>
        <WelcomePoint text="A Journey built around your dog" />
        <WelcomePoint text="Short, reward-based lessons" />
        <WelcomePoint text="Everything stays on this device" />
      </View>
      {status?.hasSavedData && status.state !== 'complete' ? (
        <View style={styles.errorCard} accessibilityRole="alert">
          <Text style={styles.sectionTitle}>Incomplete setup found</Text>
          <Text style={styles.body}>We found incomplete or unreadable setup data on this device. You can restart setup, but the saved onboarding records must be deleted first.</Text>
          {confirmRestart ? <>
            <Text style={styles.body}>Confirm that you want to delete the incomplete setup data and start again.</Text>
            <PrimaryButton title="Delete incomplete setup and restart" onPress={() => void restart()} />
            <SecondaryTextButton title="Cancel" onPress={() => setConfirmRestart(false)} />
          </> : <PrimaryButton title="Restart Setup" onPress={() => setConfirmRestart(true)} />}
          <InlineValidationMessage message={recoveryError} />
        </View>
      ) : <PrimaryButton title="Get Started" onPress={() => navigation.navigate('OwnerSetup')} />}
    </AppScreen>
  );
}

function WelcomePoint({ text }: { readonly text: string }): React.JSX.Element {
  return (
    <View style={welcomeLocal.pointRow}>
      <View style={welcomeLocal.pointIcon}>
        <ReferenceIcon name="check" size={11} color="#FFFFFF" strokeWidth={2.6} />
      </View>
      <Text style={welcomeLocal.pointText}>{text}</Text>
    </View>
  );
}

const welcomeLocal = StyleSheet.create({
  pointList: { gap: 8 },
  pointRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pointIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: referencePalette.green,
  },
  pointText: { flex: 1, color: referencePalette.navy, fontSize: 13, lineHeight: 18, fontWeight: '700' },
});
