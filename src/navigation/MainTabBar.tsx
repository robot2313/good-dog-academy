import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, Text, View } from 'react-native';

import { styles } from '../theme/styles';
import type { MainTabParamList } from '../types/navigation';
import { MainTabIcon } from './MainTabIcon';

export function MainTabBar({ state, descriptors, navigation }: BottomTabBarProps): React.JSX.Element {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = descriptors[route.key].options.title ?? route.name;
        const iconRouteName = isMainTabName(route.name) ? route.name : null;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };
        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityLabel={`${String(label)} tab`}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            onLongPress={onLongPress}
            onPress={onPress}
            style={({ pressed }) => [
              styles.tabButton,
              focused && styles.tabButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.tabIconShell, focused && styles.tabIconShellActive]}>
              {iconRouteName ? <MainTabIcon routeName={iconRouteName} focused={focused} /> : null}
            </View>
            <Text style={[styles.tabText, focused && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function isMainTabName(routeName: string): routeName is keyof MainTabParamList {
  return routeName === 'Today' || routeName === 'Academy' || routeName === 'Progress' || routeName === 'Dog';
}
