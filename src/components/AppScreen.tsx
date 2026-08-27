import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { referenceStyles } from '../theme/referenceStyles';

type AppScreenProps = PropsWithChildren<{
  scroll?: boolean;
  /** Use the tighter gutters from the reference lesson-browse layout. */
  compact?: boolean;
}>;

/**
 * The single screen shell. Every screen sits on the reference canvas with the
 * same gutters, scroll padding and vertical rhythm as the approved six-screen
 * reference, so nothing in the app reads as a different design.
 */
export function AppScreen({ children, scroll = true, compact = false }: AppScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={referenceStyles.screen}>
      <StatusBar style="dark" />
      {scroll
        ? (
          <ScrollView
            contentContainerStyle={compact ? referenceStyles.compactScroll : referenceStyles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
          >
            {children}
          </ScrollView>
        )
        : <View style={{ flex: 1 }}>{children}</View>}
    </SafeAreaView>
  );
}
