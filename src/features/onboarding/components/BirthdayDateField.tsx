import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { InlineValidationMessage } from '../../../components/InlineValidationMessage';
import { styles } from '../../../theme/styles';

function parseDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function toDateOnly(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function BirthdayDateField({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }): React.JSX.Element {
  const [showPicker, setShowPicker] = useState(false);
  const selectedDate = useMemo(() => parseDateOnly(value), [value]);
  const formatted = value
    ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(selectedDate)
    : 'Choose birthday';

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'set' && date) onChange(toDateOnly(date));
  };

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>Birthday</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Birthday, ${formatted}`} onPress={() => setShowPicker(true)} style={[styles.dateSelection, error && styles.inputError]}>
        <Text style={value ? styles.dateSelectionText : styles.dateSelectionPlaceholder}>{formatted}</Text>
      </Pressable>
      {showPicker ? <DateTimePicker value={selectedDate} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} maximumDate={new Date()} onChange={handleChange} accessibilityLabel="Select dog birthday" /> : null}
      <InlineValidationMessage message={error} />
    </View>
  );
}
