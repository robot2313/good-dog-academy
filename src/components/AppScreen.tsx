import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { styles } from '../theme/styles';

type AppScreenProps = PropsWithChildren<{
  scroll?: boolean;
}>;

export function AppScreen({ children, scroll = true }: AppScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {scroll
        ? <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>{children}</ScrollView>
        : <View style={styles.app}>{children}</View>}
    </SafeAreaView>
  );
}
