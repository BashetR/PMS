import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })

export class AppCacheService {
    roles: any[] | null = null;
    permissions: any[] | null = null;
    profile: any = null;

    constructor(private supabase: SupabaseService) { }

    async getRoles() {
        try {
            const { data, error } = await this.supabase.client
                .from('role')
                .select('*');
            if (error) throw error;
            this.roles = data || [];
            return this.roles;
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    async getPermissions() {
        try {
            if (this.permissions) return this.permissions;

            const { data, error } = await this.supabase.client
                .from('permissions')
                .select('*');

            if (error) throw error;

            this.permissions = data || [];
            return this.permissions;

        } catch (err) {
            console.error('getPermissions error:', err);
            this.permissions = [];
            return [];
        }
    }

    async getProfile(userId: string) {
        try {
            // cache check (important fix: user-specific cache)
            if (this.profile && this.profile.id === userId) {
                return this.profile;
            }

            const { data, error } = await this.supabase.client
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            this.profile = data;
            return this.profile;

        } catch (err) {
            console.error('getProfile error:', err);
            this.profile = null;
            return null;
        }
    }

    clear() {
        this.roles = null;
        this.permissions = null;
        this.profile = null;
    }
}