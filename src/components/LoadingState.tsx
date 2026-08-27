import { ActivityIndicator, Text, View } from 'react-native';

import { referencePalette, referenceScreenStyles } from '../theme/referenceStyles';

export function LoadingState({ message = 'Loading…' }: { message?: string }): React.JSX.Element {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={message} style={referenceScreenStyles.centerState}>
      <ActivityIndicator color={referencePalette.green} size="large" />
      <Text style={referenceScreenStyles.centerStateText}>{message}</Text>
    </View>
  );
}
