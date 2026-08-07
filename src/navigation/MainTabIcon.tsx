import { View } from 'react-native';

import { ReferenceIcon } from '../components/ReferenceIcon';
import { referencePalette } from '../theme/referenceStyles';
import type { MainTabParamList } from '../types/navigation';

type MainTabIconProps = {
  readonly routeName: keyof MainTabParamList;
  readonly focused: boolean;
};

export function MainTabIcon({ routeName, focused }: MainTabIconProps): React.JSX.Element {
  const color = focused ? referencePalette.navy : referencePalette.inactive;
  const name = routeName === 'Today' ? 'home' : routeName === 'Plan' ? 'journey' : routeName === 'Academy' ? 'categories' : routeName === 'Dog' ? 'dog' : 'progress';
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><ReferenceIcon name={name} size={22} color={color} strokeWidth={focused ? 2.2 : 1.8} /></View>;
}
