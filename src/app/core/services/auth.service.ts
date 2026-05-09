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
  // AUTH STATE LISTENER (CORE FIX)
  // =========================
  private initAuthListener() {

    this.supabase.client.auth.onAuthStateChange(
      async (event, session) => {

        if (event === 'SIGNED_IN' && session?.user) {
          await this.bootstrapApp();
          this.idleService.startWatching(); // ✅ FIXED PLACE
        }

        if (event === 'SIGNED_OUT') {
          this.idleService.stopWatching();  // ✅ FIXED PLACE
          this.clearAppState();
        }
      }
    );
  }

  // =========================
  // BOOTSTRAP APP
  // =========================
  private async bootstrapApp() {

    if (this.isInitialized) return;

    this.isInitialized = true;

    await this.appInit.loadInitialData();
  }

  // =========================
  // GET USER
  // =========================
  async getUser() {
    return await this.supabase.getUser();
  }

  // =========================
  // CHECK LOGIN
  // =========================
  async isLoggedIn(): Promise<boolean> {
    const session = await this.supabase.getSession();
    return !!session;
  }

  // =========================
  // LOGIN (CLEAN - NO SIDE EFFECTS)
  // =========================
  async login(payload: { Email: string; Password: string }) {

    const { data, error } =
      await this.supabase.client.auth.signInWithPassword({
        email: payload.Email,
        password: payload.Password,
      });

    if (error) throw error;

    // ❌ REMOVE idleService.startWatching()
    // handled by auth listener now

    this.router.navigate(['/app/dashboard']);

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
        role_id: 4
      });
    }

    return data;
  }

  // =========================
  // LOGOUT (CLEAN)
  // =========================
  async logout() {

    await this.supabase.signOut();
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
  // CLEAR APP STATE
  // =========================
  private clearAppState() {

    this.isInitialized = false;

    // optional:
    // clear cache, menus, permissions, etc
  }

  // =========================
  // UPDATE PASSWORD
  // =========================
  async updatePassword(newPassword: string) {

    const { error } =
      await this.supabase.client.auth.updateUser({
        password: newPassword
      });

    if (error) throw error;
  }
}