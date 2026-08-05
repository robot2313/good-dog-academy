import type { Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { getSupabaseClient } from '../../services/cloud/supabaseClient';

type AuthStatus = 'unavailable' | 'loading' | 'signed-out' | 'signed-in';

type AuthContextValue = {
  readonly status: AuthStatus;
  readonly user: User | null;
  readonly session: Session | null;
  readonly signUp: (email: string, password: string, displayName: string) => Promise<'signed-in' | 'confirmation-required'>;
  readonly signIn: (email: string, password: string) => Promise<void>;
  readonly signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren): React.JSX.Element {
  const client = getSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>(client ? 'loading' : 'unavailable');

  useEffect(() => {
    if (!client) return;
    let active = true;

    void client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      setSession(error ? null : data.session);
      setStatus(!error && data.session ? 'signed-in' : 'signed-out');
    });

    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setStatus(nextSession ? 'signed-in' : 'signed-out');
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [client]);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    if (!client) throw new Error('Cloud accounts are not configured.');
    const { data, error } = await client.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { display_name: displayName.trim() } },
    });
    if (error) throw error;
    return data.session ? 'signed-in' : 'confirmation-required';
  }, [client]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!client) throw new Error('Cloud accounts are not configured.');
    const { error } = await client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) throw error;
  }, [client]);

  const signOut = useCallback(async () => {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }, [client]);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user: session?.user ?? null,
    session,
    signUp,
    signIn,
    signOut,
  }), [session, signIn, signOut, signUp, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider.');
  return value;
}
