import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CacheService } from './cache.service';

@Injectable({ providedIn: 'root' })

export class RoleService {

    constructor(private supabase: SupabaseService, private cache: CacheService) { }

    async getById(roleId: number) {
        const cacheKey = `role_${roleId}`;
        const cached = this.cache.get<any>(cacheKey);
        if (cached) return cached;

        const { data, error } = await this.supabase.client.from('role').select('*').eq('id', roleId).single();

        if (error) throw error;
        this.cache.set(cacheKey, data);
        return data;
    }

    // async getAll() {
    //     const { data, error } = await this.supabase.client.from('role').select('*').order('created_at', { ascending: false });
    //     if (error) throw error;
    //     return data || [];
    // }

    async getActiveRoles(forceRefresh = false) {
        const cacheKey = 'active_roles';
        if (!forceRefresh) {
            const cached = this.cache.get<any[]>(cacheKey);
            if (cached) return cached;
        }

        const { data, error } = await this.supabase.client.from('role').select('id, role_name').eq('status', true).order('role_name');

        if (error) throw error;
        const roles = data || [];
        this.cache.set(cacheKey, roles);
        return roles;
    }

    // async create(payload: any) {
    //     const { data, error } = await this.supabase.client.from('role').insert(payload).select().single();
    //     if (error) throw error;
    //     this.cache.remove('active_roles');
    //     return data;
    // }

    // async update(id: any, payload: any) {
    //     const { data, error } = await this.supabase.client.from('role').update(payload).eq('id', id).select().single();
    //     if (error) throw error;
    //     this.cache.remove('role_' + id);
    //     this.cache.remove('active_roles');
    //     return data;
    // }

    // async delete(id: any) {
    //     const { error } = await this.supabase.client.from('role').delete().eq('id', id);
    //     if (error) throw error;
    //     this.cache.remove('role_' + id);
    //     this.cache.remove('active_roles');
    //     return true;
    // }
}