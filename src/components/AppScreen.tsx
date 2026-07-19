import type { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
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
        ? <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
        : <View style={styles.app}>{children}</View>}
    </SafeAreaView>
  );
}
