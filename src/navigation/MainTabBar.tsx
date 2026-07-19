import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, Text, View } from 'react-native';

import { styles } from '../theme/styles';

export function MainTabBar({ state, descriptors, navigation }: BottomTabBarProps): React.JSX.Element {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = descriptors[route.key].options.title ?? route.name;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tabButton} accessibilityRole="button" accessibilityState={focused ? { selected: true } : {}}>
            <View style={[styles.tabDot, focused && styles.tabDotActive]} />
            <Text style={[styles.tabText, focused && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
