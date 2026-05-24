import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase.service';

@Injectable({
    providedIn: 'root'
})

export class GenericService {

    constructor( private supabase: SupabaseService ) { }

    async getAll() {

        const { data, error } = await this.supabase.client
            .from('generic')
            .select('*')
            .order('generic_name');

        if (error) throw error;

        return data ?? [];
    }

    async create(payload: any) {

        const { data, error } = await this.supabase.client
            .from('generic')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    async update(id: number, payload: any) {

        const { data, error } = await this.supabase.client
            .from('generic')
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
            .from('generic')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return true;
    }
}