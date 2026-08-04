import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colorTokens } from '../theme/tokens';
import type { MainTabParamList } from '../types/navigation';

type MainTabIconProps = {
  readonly routeName: keyof MainTabParamList;
  readonly focused: boolean;
};

export function MainTabIcon({ routeName, focused }: MainTabIconProps): React.JSX.Element {
  const color = focused ? colorTokens.brand.primary : colorTokens.text.disabled;
  const shared = {
    fill: 'none',
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={22} height={22} viewBox="0 0 24 24">
        {routeName === 'Today' ? (
          <>
            <Path d="M3.5 10.5 12 3.6l8.5 6.9" {...shared} />
            <Path d="M5.5 9.2v10.3h4.2v-6h4.6v6h4.2V9.2" {...shared} />
          </>
        ) : null}
        {routeName === 'Academy' ? (
          <>
            <Path d="M4 5.2h5.2c1.6 0 2.8.9 2.8 2.4v11.2c0-1.5-1.2-2.4-2.8-2.4H4z" {...shared} />
            <Path d="M20 5.2h-5.2c-1.6 0-2.8.9-2.8 2.4v11.2c0-1.5 1.2-2.4 2.8-2.4H20z" {...shared} />
          </>
        ) : null}
        {routeName === 'Progress' ? (
          <>
            <Path d="M4 20V10.5h4V20M10 20V4h4v16M16 20v-6.5h4V20" {...shared} />
            <Path d="M2.8 20h18.4" {...shared} />
          </>
        ) : null}
        {routeName === 'Dog' ? (
          <>
            <Circle cx="7.2" cy="8.1" r="1.8" {...shared} />
            <Circle cx="16.8" cy="8.1" r="1.8" {...shared} />
            <Circle cx="10" cy="5.3" r="1.7" {...shared} />
            <Circle cx="14" cy="5.3" r="1.7" {...shared} />
            <Path d="M12 10.2c-3.8 0-6.3 3-5.4 5.8.6 1.9 2.6 2.2 4 1.2.8-.6 2-.6 2.8 0 1.4 1 3.4.7 4-1.2.9-2.8-1.6-5.8-5.4-5.8Z" {...shared} />
          </>
        ) : null}
      </Svg>
    </View>
  );
}
