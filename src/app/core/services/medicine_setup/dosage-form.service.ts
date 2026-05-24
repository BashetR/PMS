import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase.service';

@Injectable({
    providedIn: 'root'
})
export class DosageFormService {

    constructor(
        private supabase: SupabaseService
    ) { }

    async getAll() {

        const { data, error } = await this.supabase.client
            .from('dosage_form')
            .select('*')
            .order('dosage_form_name');

        if (error) throw error;

        return data ?? [];
    }

    async getById(id: number) {

        const { data, error } = await this.supabase.client
            .from('dosage_form')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        return data;
    }

    async create(payload: any) {

        const { data, error } = await this.supabase.client
            .from('dosage_form')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    async update(id: number, payload: any) {

        const { data, error } = await this.supabase.client
            .from('dosage_form')
            .update({
                ...payload,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    async delete(id: number) {

        const { error } = await this.supabase.client
            .from('dosage_form')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return true;
    }
}