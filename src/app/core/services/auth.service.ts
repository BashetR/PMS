import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { AppInitService } from './app-init.service';
import { IdleService } from './idle.service';

@Injectable({ providedIn: 'root', })

export class Auth {
  private isInitialized = false;

  constructor(private router: Router, private supabase: SupabaseService, private appInit: AppInitService, private idleService: IdleService) {
    this.initAuthListener();
  }

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

  private async bootstrapApp() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    await this.appInit.loadInitialData();
  }

  async getUser() {
    const user = await this.supabase.getUser();
    return user;
  }

  async login(payload: { Email: string; Password: string }) {
    const { data, error } =
      await this.supabase.client.auth.signInWithPassword({
        email: payload.Email,
        password: payload.Password,
      });

    if (error) throw error;
    this.router.navigate(['/dashboard']);
    return data;
  }

  async register(payload: { email: string; password: string; username: string; }) {
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

  async logout() {
    this.idleService.stopWatching();
    await this.supabase.signOut();
    this.clearAppState();
    this.router.navigate(['/login']);
  }

  async forgotPassword(email: string) {
    const { error } = await this.supabase.client.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  private clearAppState() {
    this.isInitialized = false;
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.supabase.client.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  }

  hasPermission(menu: any, permissionId: string): boolean {
    return menu.permissions?.includes(permissionId);
  }

  async otp(code: string, email: string) {
    const { data, error } = await this.supabase.client.auth.verifyOtp({
      email: email,
      token: code,
      type: 'email'
    });
    if (error) throw error;
  }

  async sendOtp(email: string) {
    const { data, error } = await this.supabase.client.auth.signInWithOtp({
      email: email
    });
    if (error) throw error;
  }
}