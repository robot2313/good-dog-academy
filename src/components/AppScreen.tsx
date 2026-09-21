import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { referenceStyles } from '../theme/referenceStyles';

type AppScreenProps = PropsWithChildren<{
  scroll?: boolean;
  compact?: boolean;
}>;

export function AppScreen({
  children,
  scroll = true,
  compact = false,
}: AppScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const baseStyle = compact
    ? referenceStyles.compactScroll
    : referenceStyles.scroll;

  return (
    <SafeAreaView
      style={referenceStyles.screen}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style="dark" />

      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            baseStyle,
            {
              paddingBottom: Math.max(insets.bottom + 24, 40),
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={{
            flex: 1,
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
