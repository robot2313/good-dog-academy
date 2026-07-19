import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { InlineValidationMessage } from '../../components/InlineValidationMessage';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useOnboarding } from '../../features/onboarding/OnboardingContext';
import { initializationErrorReporter } from '../../services/initialization/InitializationErrorReporter';
import { styles } from '../../theme/styles';
import { developmentResetService } from './developmentResetServiceInstance';
import { performDevelopmentReset } from './DevelopmentResetController';

export function DeveloperToolsSection(): React.JSX.Element | null {
  const { resetAfterDevelopmentClear } = useOnboarding();
  const [resetting, setResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!__DEV__) return null;

  const reset = async () => {
    setResetting(true);
    setErrorMessage(null);
    const result = await performDevelopmentReset(developmentResetService, initializationErrorReporter, resetAfterDevelopmentClear);
    if (!result.ok) setErrorMessage(result.error.userMessage);
    setResetting(false);
  };

  const confirmReset = () => {
    Alert.alert(
      'Reset App Data?',
      'This permanently deletes the current owner, every owned dog, training records, notification settings, and managed dog photos on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset App Data', style: 'destructive', onPress: () => void reset() },
      ],
    );
  };

  return (
    <View style={styles.developerToolsCard}>
      <Text style={styles.sectionTitle}>Developer Tools</Text>
      <Text style={styles.body}>Testing actions below permanently change local development data.</Text>
      <PrimaryButton title={resetting ? 'Resetting…' : 'Reset App Data'} onPress={confirmReset} disabled={resetting} />
      <InlineValidationMessage message={errorMessage} />
    </View>
  );
}
