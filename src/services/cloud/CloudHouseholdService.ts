import type { User } from '@supabase/supabase-js';

import type { Database, Tables } from './database.types';
import { getSupabaseClient } from './supabaseClient';

export type CloudHousehold = Tables<'households'> & { role: Tables<'household_members'>['role'] };
export type HouseholdRole = Database['public']['Enums']['household_role'];
export type TeamDogMember = Tables<'household_members'> & { displayName: string };
export type TeamDogActivity = Tables<'household_activity'> & { actorName: string };
export type TeamDogInvitation = Tables<'household_invitations'>;

export class CloudHouseholdService {
  async findHousehold(userId: string): Promise<CloudHousehold | null> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cloud accounts are not configured.');
    const { data, error } = await client
      .from('household_members')
      .select('role, households(*)')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data?.households ? { ...data.households, role: data.role } : null;
  }

  async ensureHousehold(user: User, fallbackDisplayName: string, dogName: string): Promise<CloudHousehold> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cloud accounts are not configured.');

    const metadataName = typeof user.user_metadata.display_name === 'string'
      ? user.user_metadata.display_name.trim()
      : '';
    const displayName = metadataName || fallbackDisplayName.trim() || 'Dog guardian';

    const { error: profileError } = await client
      .from('profiles')
      .upsert({ id: user.id, display_name: displayName }, { onConflict: 'id' });
    if (profileError) throw profileError;

    const existing = await this.findHousehold(user.id);
    if (existing) return existing;

    const { data: household, error: householdError } = await client
      .from('households')
      .insert({ name: `${dogName.trim() || 'My Dog'}'s Team`, created_by: user.id })
      .select()
      .single();
    if (householdError) throw householdError;

    const { error: ownerError } = await client
      .from('household_members')
      .insert({ household_id: household.id, user_id: user.id, role: 'owner' });
    if (ownerError) {
      await client.from('households').delete().eq('id', household.id);
      throw ownerError;
    }

    return { ...household, role: 'owner' };
  }

  async createInvitation(
    householdId: string,
    userId: string,
    email: string,
    role: Extract<HouseholdRole, 'trainer' | 'viewer'>,
  ): Promise<TeamDogInvitation> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cloud accounts are not configured.');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) throw new Error('Enter a valid email address.');
    const { data, error } = await client
      .from('household_invitations')
      .insert({ household_id: householdId, created_by: userId, invited_email: normalizedEmail, role })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async acceptInvitation(user: User, displayName: string, code: string): Promise<CloudHousehold> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cloud accounts are not configured.');
    const { error: profileError } = await client.from('profiles').upsert({
      id: user.id,
      display_name: displayName.trim() || 'Dog guardian',
    }, { onConflict: 'id' });
    if (profileError) throw profileError;
    const { error } = await client.rpc('accept_household_invitation', {
      invite_code_input: code.trim().toUpperCase(),
    });
    if (error) throw error;
    const household = await this.findHousehold(user.id);
    if (!household) throw new Error('The Team Dog household could not be loaded.');
    return household;
  }

  async listMembers(householdId: string): Promise<readonly TeamDogMember[]> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cloud accounts are not configured.');
    const { data: members, error } = await client
      .from('household_members')
      .select('*')
      .eq('household_id', householdId)
      .order('joined_at');
    if (error) throw error;
    if (members.length === 0) return [];
    const { data: profiles, error: profileError } = await client
      .from('profiles')
      .select('id, display_name')
      .in('id', members.map((member) => member.user_id));
    if (profileError) throw profileError;
    const names = new Map(profiles.map((profile) => [profile.id, profile.display_name]));
    return members.map((member) => ({ ...member, displayName: names.get(member.user_id) ?? 'Team member' }));
  }

  async listInvitations(householdId: string): Promise<readonly TeamDogInvitation[]> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cloud accounts are not configured.');
    const { data, error } = await client
      .from('household_invitations')
      .select('*')
      .eq('household_id', householdId)
      .is('accepted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async listActivity(householdId: string): Promise<readonly TeamDogActivity[]> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cloud accounts are not configured.');
    const { data: activity, error } = await client
      .from('household_activity')
      .select('*')
      .eq('household_id', householdId)
      .order('occurred_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    if (activity.length === 0) return [];
    const actorIds = [...new Set(activity.map((item) => item.actor_user_id))];
    const { data: profiles, error: profileError } = await client
      .from('profiles')
      .select('id, display_name')
      .in('id', actorIds);
    if (profileError) throw profileError;
    const names = new Map(profiles.map((profile) => [profile.id, profile.display_name]));
    return activity.map((item) => ({ ...item, actorName: names.get(item.actor_user_id) ?? 'Team member' }));
  }

  async updateMemberRole(
    householdId: string,
    userId: string,
    role: Extract<HouseholdRole, 'trainer' | 'viewer'>,
  ): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cloud accounts are not configured.');
    const { error } = await client
      .from('household_members')
      .update({ role })
      .eq('household_id', householdId)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async removeMember(householdId: string, userId: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cloud accounts are not configured.');
    const { error } = await client
      .from('household_members')
      .delete()
      .eq('household_id', householdId)
      .eq('user_id', userId);
    if (error) throw error;
  }
}

export const cloudHouseholdService = new CloudHouseholdService();
