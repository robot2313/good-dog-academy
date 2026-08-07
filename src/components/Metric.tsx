import { Text, View } from 'react-native';

import { referenceScreenStyles } from '../theme/referenceStyles';

type MetricProps = {
  value: string | number;
  label: string;
};

/** A single stat tile in the reference progress snapshot row. */
export function Metric({ value, label }: MetricProps): React.JSX.Element {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={referenceScreenStyles.statTile}>
      <Text style={referenceScreenStyles.statValue}>{value}</Text>
      <Text style={referenceScreenStyles.statLabel}>{label}</Text>
    </View>
  );
}
