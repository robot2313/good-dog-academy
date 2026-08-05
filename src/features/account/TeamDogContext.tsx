import { AppState } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

import { appStorage } from '../../services/appStorage';
import { cloudHouseholdService, type CloudHousehold } from '../../services/cloud/CloudHouseholdService';
import { cloudSyncService, type CloudSyncResult } from '../../services/cloud/CloudSyncService';
import type { Tables } from '../../services/cloud/database.types';
import { getSupabaseClient } from '../../services/cloud/supabaseClient';
import { storageKeys } from '../../storage/storageKeys';
import { useOnboarding } from '../onboarding/OnboardingContext';
import { useAuth } from './AuthContext';

type StoredSync = { readonly userId: string; readonly householdId: string; readonly enabled: true; readonly uploadAfter: string };
type SyncStatus = 'off' | 'idle' | 'syncing' | 'error';

type TeamDogContextValue = {
  readonly household: CloudHousehold | null;
  readonly syncStatus: SyncStatus;
  readonly lastResult: CloudSyncResult | null;
  readonly lastSyncedAt: string | null;
  readonly enableSync: (household: CloudHousehold) => Promise<CloudSyncResult>;
  readonly syncNow: () => Promise<CloudSyncResult>;
  readonly refreshHousehold: () => Promise<CloudHousehold | null>;
};

const TeamDogContext = createContext<TeamDogContextValue | null>(null);

function isStoredSync(value: unknown): value is StoredSync {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoredSync>;
  return candidate.enabled === true
    && typeof candidate.userId === 'string'
    && typeof candidate.householdId === 'string'
    && typeof candidate.uploadAfter === 'string';
}

function isCloudRecord(value: unknown): value is Tables<'cloud_records'> {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<Tables<'cloud_records'>>;
  return typeof record.household_id === 'string'
    && typeof record.entity_type === 'string'
    && typeof record.record_id === 'string'
    && typeof record.local_updated_at === 'string';
}

export function TeamDogProvider({ children }: PropsWithChildren): React.JSX.Element {
  const auth = useAuth();
  const { refreshApplicationStatus } = useOnboarding();
  const [household, setHousehold] = useState<CloudHousehold | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('off');
  const [lastResult, setLastResult] = useState<CloudSyncResult | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const syncing = useRef(false);
  const uploadAfter = useRef<string | undefined>(undefined);

  const refreshHousehold = useCallback(async () => {
    if (!auth.user) {
      setHousehold(null);
      return null;
    }
    const next = await cloudHouseholdService.findHousehold(auth.user.id);
    setHousehold(next);
    return next;
  }, [auth.user]);

  const runSync = useCallback(async (target: CloudHousehold): Promise<CloudSyncResult> => {
    if (!auth.user || syncing.current) return { pushed: 0, pulled: 0 };
    syncing.current = true;
    setSyncStatus('syncing');
    try {
      const result = await cloudSyncService.sync(target.id, auth.user, target.role, uploadAfter.current);
      setLastResult(result);
      setLastSyncedAt(new Date().toISOString());
      setSyncStatus('idle');
      if (result.pulled > 0) await refreshApplicationStatus();
      return result;
    } catch (cause) {
      setSyncStatus('error');
      throw cause;
    } finally {
      syncing.current = false;
    }
  }, [auth.user, refreshApplicationStatus]);

  const enableSync = useCallback(async (target: CloudHousehold) => {
    if (!auth.user) throw new Error('Please sign in first.');
    const enabledAt = new Date().toISOString();
    await appStorage.setItem<StoredSync>(storageKeys.teamDogSync, {
      userId: auth.user.id,
      householdId: target.id,
      enabled: true,
      uploadAfter: enabledAt,
    });
    uploadAfter.current = enabledAt;
    setSyncEnabled(true);
    setHousehold(target);
    return runSync(target);
  }, [auth.user, runSync]);

  const syncNow = useCallback(async () => {
    if (!household) throw new Error('Set up or join a Team Dog household first.');
    return runSync(household);
  }, [household, runSync]);

  useEffect(() => {
    if (!auth.user) {
      setHousehold(null);
      setSyncStatus('off');
      setSyncEnabled(false);
      uploadAfter.current = undefined;
      return;
    }
    let active = true;
    void appStorage.getItem<unknown>(storageKeys.teamDogSync).then(async (stored) => {
      if (!active || !isStoredSync(stored) || stored.userId !== auth.user?.id) return;
      const found = await cloudHouseholdService.findHousehold(stored.userId);
      if (!active || !found || found.id !== stored.householdId) return;
      uploadAfter.current = stored.uploadAfter;
      setHousehold(found);
      setSyncEnabled(true);
      setSyncStatus('idle');
      await runSync(found);
    }).catch(() => {
      if (active) setSyncStatus('error');
    });
    return () => { active = false; };
  }, [auth.user, runSync]);

  useEffect(() => {
    if (!household || !syncEnabled) return;
    const client = getSupabaseClient();
    if (!client) return;
    const handleRecord = (value: unknown): void => {
      if (!isCloudRecord(value) || value.household_id !== household.id) return;
      void cloudSyncService.applyRealtimeRecord(value).then(async () => {
        setLastSyncedAt(new Date().toISOString());
        await refreshApplicationStatus();
      }).catch(() => setSyncStatus('error'));
    };
    const channel = client
      .channel(`team-dog-${household.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cloud_records', filter: `household_id=eq.${household.id}` }, (payload) => handleRecord(payload.new))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cloud_records', filter: `household_id=eq.${household.id}` }, (payload) => handleRecord(payload.new))
      .subscribe();
    const timer = setInterval(() => { void runSync(household).catch(() => undefined); }, 30_000);
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') void runSync(household).catch(() => undefined);
    });
    return () => {
      clearInterval(timer);
      appState.remove();
      void client.removeChannel(channel);
    };
  }, [household, refreshApplicationStatus, runSync, syncEnabled]);

  const value = useMemo<TeamDogContextValue>(() => ({
    household,
    syncStatus,
    lastResult,
    lastSyncedAt,
    enableSync,
    syncNow,
    refreshHousehold,
  }), [enableSync, household, lastResult, lastSyncedAt, refreshHousehold, syncNow, syncStatus]);

  return <TeamDogContext.Provider value={value}>{children}</TeamDogContext.Provider>;
}

export function useTeamDog(): TeamDogContextValue {
  const value = useContext(TeamDogContext);
  if (!value) throw new Error('useTeamDog must be used within TeamDogProvider.');
  return value;
}
