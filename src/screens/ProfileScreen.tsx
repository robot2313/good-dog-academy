import { Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { useAppState } from '../state/AppStateContext';
import { styles } from '../theme/styles';
import { SelectionChips } from '../components/SelectionChips';
import { useReminder } from '../features/notifications/ReminderContext';

const reminderOptions: readonly { value: string; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: '08:00', label: 'Morning · 8:00' },
  { value: '12:00', label: 'Midday · 12:00' },
  { value: '18:00', label: 'Evening · 18:00' },
];

declare const require: (moduleName: string) => { DeveloperToolsSection: () => React.JSX.Element | null };
const DeveloperToolsSection = __DEV__
  ? require('../development/reset/DeveloperToolsSection').DeveloperToolsSection
  : null;

export function ProfileScreen(): React.JSX.Element {
  const { profile } = useAppState();
  const { settings, loading, saving, error, delivery, setReminder } = useReminder();
  const reminderValue = settings?.dailyReminderEnabled ? settings.dailyReminderTime : 'off';

  return (
    <AppScreen>
      <Text style={styles.eyebrowDark}>DOG PROFILE</Text>
      <Text style={styles.pageTitle}>{profile.name || 'My Dog'}</Text>
      <View style={styles.membershipCard}>
        <Text style={styles.membershipEyebrow}>FOUNDER ACCOUNT</Text>
        <Text style={styles.membershipTitle}>Lifetime All Access</Text>
        <Text style={styles.membershipBody}>Your owner account stays unlocked as premium features are added.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Breed or mix</Text>
        <Text style={styles.profileValue}>{profile.breed || 'Not specified'}</Text>
        <Text style={styles.label}>Current build</Text>
        <Text style={styles.profileValue}>Stable Foundation 1.0</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Training reminder</Text>
        <Text style={styles.body}>A gentle local reminder helps protect a short daily training rhythm. No account or cloud service is required.</Text>
        {loading ? <Text style={styles.body}>Loading reminder settings…</Text> : settings ? <SelectionChips label="Daily reminder time" options={reminderOptions} value={reminderValue} onChange={(value) => void setReminder(value === 'off' ? null : value)} /> : null}
        {saving ? <Text style={styles.reminderStatus}>Updating reminder…</Text> : null}
        {delivery === 'scheduled' ? <Text style={styles.reminderSuccess}>Reminder scheduled on this phone.</Text> : null}
        {delivery === 'disabled' ? <Text style={styles.reminderStatus}>Daily reminders are off.</Text> : null}
        {delivery === 'denied' ? <Text style={styles.validationText}>Notifications are blocked in device settings. Your preferred time is still saved.</Text> : null}
        {delivery === 'unsupported' ? <Text style={styles.reminderStatus}>Preference saved. Notification delivery is available in the iOS and Android app.</Text> : null}
        {error ? <Text style={styles.validationText}>{error}</Text> : null}
      </View>
      {__DEV__ && DeveloperToolsSection ? <DeveloperToolsSection /> : null}
    </AppScreen>
  );
}
