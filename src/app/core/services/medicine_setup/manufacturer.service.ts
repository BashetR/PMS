import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase.service';

@Injectable({
    providedIn: 'root'
})
export class ManufacturerService {

    constructor(private supabase: SupabaseService) { }

    async getManufacturers() {

        const { data, error } = await this.supabase.client
            .from('manufacturer')
            .select('*')
            .order('manufacturer_name');

        if (error) throw error;

        return data || [];
    }

    async createManufacturer(payload: any) {

        const { data, error } = await this.supabase.client
            .from('manufacturer')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    async updateManufacturer(id: number, payload: any) {

        const { data, error } = await this.supabase.client
            .from('manufacturer')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    async deleteManufacturer(id: number) {

        const { error } = await this.supabase.client
            .from('manufacturer')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return true;
    }
}