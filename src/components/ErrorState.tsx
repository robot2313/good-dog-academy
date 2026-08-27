import { Text, View } from 'react-native';

import { referenceScreenStyles } from '../theme/referenceStyles';
import { PrimaryButton } from './PrimaryButton';

export function ErrorState({ message, onRetry, actionTitle = 'Try again' }: { message: string; onRetry: () => void; actionTitle?: string }): React.JSX.Element {
  return (
    <View accessibilityRole="alert" style={referenceScreenStyles.noticeAlert}>
      <Text style={referenceScreenStyles.noticeAlertTitle}>Something went wrong</Text>
      <Text style={referenceScreenStyles.noticeAlertBody}>{message}</Text>
      <View style={{ marginTop: 6 }}>
        <PrimaryButton title={actionTitle} onPress={onRetry} />
      </View>
    </View>
  );
}
