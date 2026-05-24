import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
    providedIn: 'root'
})
export class ClinicalKvService {

    constructor(
        private supabase: SupabaseService
    ) { }

    async getAll() {

        const { data, error } = await this.supabase.client
            .from('clinical_kv')
            .select(`
                *,
                clinical_key:clinical_key_id(
                    id,
                    name
                )
            `)
            .order('clinical_kv_id');

        if (error) throw error;

        return data || [];
    }

    async getClinicalKeys() {

        const { data, error } = await this.supabase.client
            .from('clinical_key')
            .select('*')
            .eq('is_active', true)
            .order('id', { ascending: true });

        if (error) throw error;

        return data || [];
    }

    async create(payload: any) {

        const { data, error } = await this.supabase.client
            .from('clinical_kv')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    async update(id: number, payload: any) {

        const { data, error } = await this.supabase.client
            .from('clinical_kv')
            .update(payload)
            .eq('clinical_kv_id', id)
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    async delete(id: number) {

        const { error } = await this.supabase.client
            .from('clinical_kv')
            .delete()
            .eq('clinical_kv_id', id);

        if (error) throw error;

        return true;
    }
}