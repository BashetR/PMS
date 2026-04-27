import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { AppInitService } from './app-init.service';
import { IdleService } from './idle.service';

@Injectable({
  providedIn: 'root',
})
export class Auth {

  private isInitialized = false;

  constructor(
    private router: Router,
    private supabase: SupabaseService,
    private appInit: AppInitService,
    private idleService: IdleService
  ) {
    this.initAuthListener();
  }

  // =========================
  // SESSION RESTORE HANDLER
  // =========================
  private initAuthListener() {
    this.supabase.client.auth.onAuthStateChange(async (event, session) => {

      if (event === 'SIGNED_IN' && session?.user) {
        await this.bootstrapApp();
      }

      if (event === 'SIGNED_OUT') {
        this.clearAppState();
      }
    });
  }

  // =========================
  // SAFE APP BOOTSTRAP
  // =========================
  private async bootstrapApp() {
    if (this.isInitialized) return;

    this.isInitialized = true;
    await this.appInit.loadInitialData();
  }

  async getUser() {
    const user = await this.supabase.getUser();
    return user;
  }

  // =========================
  // LOGIN
  // =========================
  async login(payload: { Email: string; Password: string }) {

    const { data, error } =
      await this.supabase.client.auth.signInWithPassword({
        email: payload.Email,
        password: payload.Password,
      });

    if (error) throw error;

    // IMPORTANT: AppInit will be triggered by auth listener
    this.router.navigate(['/dashboard']);

    return data;
  }

  // =========================
  // REGISTER
  // =========================
  async register(payload: {
    email: string;
    password: string;
    username: string;
  }) {

    const { data, error } =
      await this.supabase.client.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: {
            username: payload.username,
          },
        },
      });

    if (error) throw error;

    if (data.user) {
      await this.supabase.client.from('profiles').insert({
        id: data.user.id,
        username: payload.username,
        email: payload.email,
        role: 'User',
        role_id: 4
      });
    }

    return data;
  }

  // =========================
  // LOGOUT
  // =========================
  async logout() {
    this.idleService.stopWatching();
    await this.supabase.signOut();
    this.clearAppState();
    this.router.navigate(['/login']);
  }

  // =========================
  // FORGOT PASSWORD
  // =========================
  async forgotPassword(email: string) {
    const { error } =
      await this.supabase.client.auth.resetPasswordForEmail(email);

    if (error) throw error;
  }

  // =========================
  // CLEAR CACHE + STATE
  // =========================
  private clearAppState() {
    this.isInitialized = false;
    // optionally clear cache here
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.supabase.client.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  }
}