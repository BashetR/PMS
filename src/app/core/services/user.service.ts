import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CacheService } from './cache.service';

@Injectable({ providedIn: 'root' })
export class UserService {

  constructor(
    private supabase: SupabaseService,
    private cache: CacheService
  ) { }

  // =========================
  // GET CURRENT USER PROFILE (SAFE CACHE)
  // =========================
  async getProfile(userId: string) {

    const cacheKey = `profile_${userId}`;

    const cached = this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    this.cache.set(cacheKey, data);

    return data;
  }

  // =========================
  // ADMIN: GET ALL USERS
  // =========================
  async getUsers() {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  // =========================
  // GET USER BY ID (OPTIONAL CLEAN WRAPPER)
  // =========================
  async getUserById(id: string) {
    return this.getProfile(id);
  }

  // =========================
  // CREATE USER
  // =========================
  async createUser(user: any) {

    const { data, error } = await this.supabase.client
      .from('profiles')
      .insert({
        full_name: user.full_name,
        email: user.email,
        role_id: user.role_id,
        is_active: user.is_active ?? true
      })
      .select()
      .single();

    if (error) throw error;

    this.cache.remove(`profile_${data.id}`);

    return data;
  }

  // =========================
  // UPDATE USER
  // =========================
  async updateUser(id: string, user: any) {

    const { data, error } = await this.supabase.client
      .from('profiles')
      .update(user)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // invalidate cache
    this.cache.remove(`profile_${id}`);

    return data;
  }

  // =========================
  // UPDATE ROLE (IMPORTANT FIX)
  // =========================
  async updateUserRole(id: string, role_id: number) {

    const { data, error } = await this.supabase.client
      .from('profiles')
      .update({ role_id })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // invalidate cache
    this.cache.remove(`profile_${id}`);

    return data;
  }

  // =========================
  // TOGGLE STATUS
  // =========================
  async toggleUserStatus(id: string, is_active: boolean) {

    const { data, error } = await this.supabase.client
      .from('profiles')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    this.cache.remove(`profile_${id}`);

    return data;
  }

  // =========================
  // DELETE USER
  // =========================
  async deleteUser(id: string) {

    const { error } = await this.supabase.client
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    this.cache.remove(`profile_${id}`);

    return true;
  }

  async ensureProfile(user: any) {

    const { data: profile } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) return profile;

    const { data } = await this.supabase.client
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email
      })
      .select()
      .single();

    return data;
  }
}