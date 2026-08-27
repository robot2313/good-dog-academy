import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { styles } from '../theme/styles';

type LessonScaffoldProps = PropsWithChildren<{
  /** Pinned bottom action region — always visible without scrolling. */
  readonly footer: ReactNode;
  /**
   * When true (default) the content area scrolls if it overflows (used for the
   * information-rich Get Ready / Before You Begin screens). When false the
   * content is a fixed flex column (the no-scroll active-session screen).
   */
  readonly scroll?: boolean;
}>;

/**
 * Shared layout for the principal lesson screens: a content area with a stable
 * bottom action bar. The footer is rendered outside the scroll area so the
 * Back / forward controls stay visible without scrolling on a normal iPhone,
 * while unusually tall content (or large accessibility text) can still scroll
 * safely above the pinned actions.
 */
export function LessonScaffold({ children, footer, scroll = true }: LessonScaffoldProps): React.JSX.Element {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.lessonScaffoldSafe}>
      <StatusBar style="dark" />
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.lessonScaffoldScroll}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.lessonScaffoldFixed}>{children}</View>
      )}
      <View style={styles.lessonScaffoldFooter}>{footer}</View>
    </SafeAreaView>
  );
}
