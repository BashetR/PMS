import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
    providedIn: 'root'
})

export class ProfileService {
    constructor(private supabase: SupabaseService) { }

    async getProfile() {
        const { data: user } = await this.supabase.client.auth.getUser();

        const { data, error } = await this.supabase.client
            .from('profiles')
            .select('*')
            .eq('id', user.user?.id)
            .single();

        if (error) throw error;
        return data;
    }

    async updateProfile(profile: any) {
        const { data: user } = await this.supabase.client.auth.getUser();

        const { data, error } = await this.supabase.client
            .from('profiles')
            .update(profile)
            .eq('id', user.user?.id);

        if (error) throw error;
        return data;
    }
}