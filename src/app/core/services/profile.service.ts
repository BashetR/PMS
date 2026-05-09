import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CacheService } from './cache.service';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {

    constructor(
        private supabase: SupabaseService,
        private cache: CacheService
    ) { }

    // =========================
    // GET PROFILE
    // =========================
    async getProfile(userId: string) {

        const cacheKey = `profile_${userId}`;

        // CACHE
        const cached =
            this.cache.get<any>(cacheKey);

        if (cached) {
            return cached;
        }

        const { data, error } =
            await this.supabase.client
                .from('profiles')
                .select(`
                    *,
                    role:role_id (
                        id,
                        role_name
                    )
                `)
                .eq('id', userId)
                .single();

        if (error) {
            throw error;
        }

        // SAVE CACHE
        this.cache.set(cacheKey, data);

        return data;
    }

    // =========================
    // CREATE DEFAULT PROFILE
    // =========================
    async createDefaultProfile(
        user: any,
        roleId: number | null = null
    ) {

        // CHECK EXISTING PROFILE
        const { data: existing } =
            await this.supabase.client
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();

        // ALREADY EXISTS
        if (existing) {
            return existing;
        }

        const payload = {

            id: user.id,

            email: user.email || null,

            username: null,

            full_name: null,

            website: null,

            country: null,

            gender: null,

            phone: null,

            avatar_url: null,

            doctor_reg_no: null,

            role_id: roleId,

            is_active: true
        };

        const { data, error } =
            await this.supabase.client
                .from('profiles')
                .insert(payload)
                .select()
                .single();

        if (error) {
            throw error;
        }

        // CLEAR CACHE
        this.cache.remove(`profile_${user.id}`);

        return data;
    }

    // =========================
    // UPDATE PROFILE
    // =========================
    async updateProfile(
        userId: string,
        payload: any
    ) {

        // REMOVE UNNECESSARY FIELDS
        delete payload.id;
        delete payload.role;
        delete payload.created_at;
        delete payload.updated_at;

        const cleanPayload = {

            username:
                payload.username || null,

            full_name:
                payload.full_name || null,

            website:
                payload.website || null,

            country:
                payload.country || null,

            gender:
                payload.gender || null,

            phone:
                payload.phone || null,

            avatar_url:
                payload.avatar_url || null,

            doctor_reg_no:
                payload.doctor_reg_no || null,

            role_id:
                payload.role_id || null
        };

        const { data, error } =
            await this.supabase.client
                .from('profiles')
                .update(cleanPayload)
                .eq('id', userId)
                .select(`
                    *,
                    role:role_id (
                        id,
                        role_name
                    )
                `)
                .single();

        if (error) {
            throw error;
        }

        // CLEAR CACHE
        this.cache.remove(`profile_${userId}`);

        return data;
    }

    // =========================
    // UPSERT PROFILE
    // =========================
    async upsertProfile(payload: any) {

        const cleanPayload = {

            id: payload.id,

            email:
                payload.email || null,

            username:
                payload.username || null,

            full_name:
                payload.full_name || null,

            website:
                payload.website || null,

            country:
                payload.country || null,

            gender:
                payload.gender || null,

            phone:
                payload.phone || null,

            avatar_url:
                payload.avatar_url || null,

            doctor_reg_no:
                payload.doctor_reg_no || null,

            role_id:
                payload.role_id || null,

            is_active:
                payload.is_active ?? true
        };

        const { data, error } =
            await this.supabase.client
                .from('profiles')
                .upsert(cleanPayload, {
                    onConflict: 'id'
                })
                .select(`
                    *,
                    role:role_id (
                        id,
                        role_name
                    )
                `)
                .single();

        if (error) {
            throw error;
        }

        // CLEAR CACHE
        if (payload?.id) {

            this.cache.remove(
                `profile_${payload.id}`
            );
        }

        return data;
    }

    // =========================
    // DELETE PROFILE CACHE
    // =========================
    clearProfileCache(userId: string) {

        this.cache.remove(
            `profile_${userId}`
        );
    }
}