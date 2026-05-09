import { Injectable } from '@angular/core';
import {
    createClient,
    Session,
    SupabaseClient,
    User
} from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {

    private supabase: SupabaseClient;
    private channels: any[] = [];

    constructor() {
        this.supabase = createClient(
            environment.supabaseUrl,
            environment.supabaseKey
        );
    }

    // =========================
    // CORE CLIENT
    // =========================
    get client(): SupabaseClient {
        return this.supabase;
    }

    // =========================
    // AUTH (SAFE + CONSISTENT)
    // =========================
    async getSession(): Promise<Session | null> {

        const { data, error } =
            await this.supabase.auth.getSession();

        if (error) throw error;

        return data.session;
    }

    async getUser(): Promise<User | null> {

        const { data, error } =
            await this.supabase.auth.getUser();

        if (error) throw error;

        return data.user;
    }

    async signOut() {
        return await this.supabase.auth.signOut();
    }

    onAuthChange(callback: (session: Session | null) => void) {

        return this.supabase.auth.onAuthStateChange(
            (_event, session) => callback(session)
        );
    }

    // =========================
    // DB WRAPPER (SAFE ERROR THROWING)
    // =========================
    select(table: string, query = '*') {
        return this.supabase.from(table).select(query);
    }

    insert(table: string, data: any) {
        return this.supabase.from(table).insert(data);
    }

    update(table: string, data: any, match: any) {
        return this.supabase.from(table).update(data).match(match);
    }

    delete(table: string, match: any) {
        return this.supabase.from(table).delete().match(match);
    }

    // =========================
    // REALTIME (IMPROVED)
    // =========================
    listen(
        table: string,
        callback: (payload: any) => void,
        filter?: any
    ) {

        const channelName = `${table}-changes`;

        const channel = this.supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table,
                    filter
                },
                (payload) => callback(payload)
            )
            .subscribe();

        this.channels.push(channel);

        return channel;
    }

    // =========================
    // REMOVE ALL LISTENERS
    // =========================
    removeAllListeners() {

        this.channels.forEach(channel => {
            this.supabase.removeChannel(channel);
        });

        this.channels = [];
    }
}