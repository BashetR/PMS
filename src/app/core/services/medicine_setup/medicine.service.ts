import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase.service';

@Injectable({
    providedIn: 'root'
})
export class MedicineService {

    constructor(
        private supabase: SupabaseService
    ) { }

    async getMedicines() {

        const { data, error } = await this.supabase.client
            .from('medicine')
            .select(`
        *,
        generic:generic_id(
          id,
          generic_name
        ),
        dosage_form:dosage_form_id(
          id,
          dosage_form_name
        ),
        manufacturer:manufacturer_id(
          id,
          manufacturer_name
        )
      `)
            .order('medicine_name');

        if (error) throw error;

        return data || [];
    }

    async createMedicine(payload: any) {

        const { data, error } = await this.supabase.client
            .from('medicine')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    async updateMedicine(
        id: number,
        payload: any
    ) {

        const { data, error } = await this.supabase.client
            .from('medicine')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    async deleteMedicine(id: number) {

        const { error } = await this.supabase.client
            .from('medicine')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return true;
    }

    // Dropdowns

    async getGenerics() {

        const { data, error } = await this.supabase.client
            .from('generic')
            .select('id,generic_name')
            .eq('is_active', true)
            .order('generic_name');

        if (error) throw error;

        return data || [];
    }

    async getDosageForms() {

        const { data, error } = await this.supabase.client
            .from('dosage_form')
            .select('id,dosage_form_name')
            .eq('is_active', true)
            .order('dosage_form_name');

        if (error) throw error;

        return data || [];
    }

    async getManufacturers() {

        const { data, error } = await this.supabase.client
            .from('manufacturer')
            .select('id,manufacturer_name')
            .eq('is_active', true)
            .order('manufacturer_name');

        if (error) throw error;

        return data || [];
    }

}