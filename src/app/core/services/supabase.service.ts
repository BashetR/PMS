import { Injectable } from '@angular/core';
import { createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';


@Injectable({
    providedIn: 'root'
})
export class SupabaseService {

    private supabase: SupabaseClient;

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
    // AUTH
    // =========================
    async getSession(): Promise<Session | null> {
        const { data, error } = await this.supabase.auth.getSession();
        if (error) {
            console.error('Session error:', error);
            return null;
        }
        return data.session;
    }

    async getUser(): Promise<User | null> {
        const { data, error } = await this.supabase.auth.getUser();
        if (error) {
            console.error('User error:', error);
            return null;
        }
        return data.user;
    }

    signOut() {
        return this.supabase.auth.signOut();
    }

    onAuthChange(callback: (session: Session | null) => void) {
        return this.supabase.auth.onAuthStateChange((_event, session) => {
            callback(session);
        });
    }

    async isLoggedIn(): Promise<boolean> {
        const session = await this.getSession();
        return !!session;
    }

    // =========================
    // CLEAN DATABASE ACCESS
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
    // REALTIME (TRACK CHANNELS)
    // =========================
    private channels: any[] = [];

    listen(table: string, callback: (payload: any) => void) {
        const channel = this.supabase
            .channel(`${table}-changes`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table },
                (payload) => callback(payload)
            )
            .subscribe();

        this.channels.push(channel);

        return channel;
    }

    // =========================
    // CLEANUP REALTIME
    // =========================
    removeAllListeners() {
        this.channels.forEach(channel => {
            this.supabase.removeChannel(channel);
        });

        this.channels = [];
    }
}