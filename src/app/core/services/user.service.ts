import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })

export class UserService {

  constructor(private supabase: SupabaseService) { }

  async getUsers() {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    return data || [];
  }

  async createUser(user: any) {
    const { data: authUser } = await this.supabase.client.auth.getUser();
    const { data, error } = await this.supabase.client
      .from('profiles')
      .insert({id: authUser.user?.id,...user});

    if (error) throw error;
    return data;
  }

  async updateUser(id: string, user: any) {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .update(user)
      .eq('id', id);

    if (error) throw error;
    return data;
  }

  async deleteUser(id: string) {
    const { error } = await this.supabase.client
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}