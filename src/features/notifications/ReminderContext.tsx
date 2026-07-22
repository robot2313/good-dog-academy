import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { NotificationSettings } from '../../domain/models';
import { appStorage } from '../../services/appStorage';
import { StorageTransactionManager } from '../../storage/StorageTransactionManager';
import { createLocalId } from '../../utils/ids';
import { useOnboarding } from '../onboarding/OnboardingContext';
import { ExpoNotificationScheduler, type NotificationDeliveryStatus } from './NotificationScheduler';
import { NotificationSettingsService } from './NotificationSettingsService';

type ReminderContextValue = { settings: NotificationSettings | null; loading: boolean; saving: boolean; error: string | null; delivery: NotificationDeliveryStatus | null; setReminder: (time: string | null) => Promise<void> };
const ReminderContext = createContext<ReminderContextValue | undefined>(undefined);
const service = new NotificationSettingsService(new StorageTransactionManager(appStorage), new ExpoNotificationScheduler(), createLocalId, () => new Date().toISOString(), () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');

export function ReminderProvider({ children }: PropsWithChildren): React.JSX.Element {
  const { status } = useOnboarding();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<NotificationDeliveryStatus | null>(null);

  useEffect(() => {
    if (status?.state !== 'complete') { setSettings(null); return; }
    setLoading(true); setError(null);
    void service.load(status.owner.id).then(setSettings).catch(() => setError('Reminder settings could not be loaded.')).finally(() => setLoading(false));
  }, [status]);

  const setReminder = useCallback(async (time: string | null) => {
    if (!settings) return;
    setSaving(true); setError(null);
    try { const result = await service.setDailyReminder(settings, time); setSettings(result.settings); setDelivery(result.delivery); }
    catch { setError('The reminder could not be updated.'); }
    finally { setSaving(false); }
  }, [settings]);

  const value = useMemo(() => ({ settings, loading, saving, error, delivery, setReminder }), [delivery, error, loading, saving, setReminder, settings]);
  return <ReminderContext.Provider value={value}>{children}</ReminderContext.Provider>;
}

export function useReminder(): ReminderContextValue {
  const value = useContext(ReminderContext);
  if (!value) throw new Error('useReminder must be used within ReminderProvider');
  return value;
}
