import { Text, View } from 'react-native';

import { styles } from '../theme/styles';

type MetricProps = {
  value: string | number;
  label: string;
};

export function Metric({ value, label }: MetricProps): React.JSX.Element {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={styles.metric}
    >
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}
