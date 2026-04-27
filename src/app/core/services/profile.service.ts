import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CacheService } from './cache.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {

    constructor(
        private supabase: SupabaseService,
        private cache: CacheService
    ) { }

    // =========================
    // GET PROFILE (WITH CACHE)
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
    // CREATE DEFAULT PROFILE
    // =========================
    async createDefaultProfile(user: any, roleId: number | null) {

        const payload = {
            id: user.id,
            email: user.email,
            is_active: true,
            role_id: roleId
        };

        const { error } = await this.supabase.client
            .from('profiles')
            .insert(payload);

        if (error) throw error;

        // clear cache (new user)
        this.cache.remove(`profile_${user.id}`);
    }

    // =========================
    // UPDATE PROFILE
    // =========================
    async updateProfile(userId: string, payload: any) {

        const { data, error } = await this.supabase.client
            .from('profiles')
            .update(payload)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        // invalidate cache
        this.cache.remove(`profile_${userId}`);

        return data;
    }

    // =========================
    // UPSERT PROFILE
    // =========================
    async upsertProfile(payload: any) {

        const { data, error } = await this.supabase.client
            .from('profiles')
            .upsert(payload, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;

        // invalidate cache
        if (payload?.id) {
            this.cache.remove(`profile_${payload.id}`);
        }

        return data;
    }
}