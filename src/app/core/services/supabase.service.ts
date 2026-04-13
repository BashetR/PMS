import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})

export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            environment.baseUrl,
            environment.supabaseKey
        );
    }

    get client() {
        return this.supabase;
    }
}