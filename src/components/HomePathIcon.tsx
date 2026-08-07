import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type HomePathIconKind = 'journey' | 'recommended' | 'categories' | 'stages';

type Props = {
  readonly kind: HomePathIconKind;
  readonly color: string;
};

export function HomePathIcon({ kind, color }: Props): React.JSX.Element {
  const shared = {
    fill: 'none',
    stroke: color,
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={30} height={30} viewBox="0 0 32 32">
        {kind === 'journey' ? (
          <>
            <Circle cx="7" cy="24" r="2.6" {...shared} />
            <Circle cx="16" cy="8" r="2.6" {...shared} />
            <Circle cx="25" cy="23" r="2.6" {...shared} />
            <Path d="M8.8 22.1c2.3-2.1 3.1-4.7 3.2-7.2.1-2.5 1.3-4.2 2.5-5.2M18.4 9.6c2.4 1.5 3.3 3.4 3.1 5.4-.2 2.2.7 4.1 2.1 5.8" {...shared} />
            <Path d="m19.2 20.1 4.4.7-1.3-4.2" {...shared} />
          </>
        ) : null}
        {kind === 'recommended' ? (
          <Path d="m16 4.2 3.5 7.1 7.9 1.1-5.7 5.6 1.4 7.8-7.1-3.7-7.1 3.7 1.4-7.8-5.7-5.6 7.9-1.1Z" {...shared} />
        ) : null}
        {kind === 'categories' ? (
          <>
            <Rect x="4.5" y="4.5" width="9" height="9" rx="2" {...shared} />
            <Rect x="18.5" y="4.5" width="9" height="9" rx="2" {...shared} />
            <Rect x="4.5" y="18.5" width="9" height="9" rx="2" {...shared} />
            <Rect x="18.5" y="18.5" width="9" height="9" rx="2" {...shared} />
          </>
        ) : null}
        {kind === 'stages' ? (
          <>
            <Circle cx="8.2" cy="10" r="2" {...shared} />
            <Circle cx="23.8" cy="10" r="2" {...shared} />
            <Circle cx="16" cy="7" r="2.2" {...shared} />
            <Path d="M16 12.2c-5.2 0-8.6 4.1-7.4 7.9.8 2.6 3.5 3 5.4 1.6 1.1-.8 2.9-.8 4 0 1.9 1.4 4.6 1 5.4-1.6 1.2-3.8-2.2-7.9-7.4-7.9Z" {...shared} />
          </>
        ) : null}
      </Svg>
    </View>
  );
}
