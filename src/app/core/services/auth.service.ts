import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})

export class Auth {
  private baseUrl = environment.apiUrl;
  private accountUrl = this.baseUrl +  'Account/';

  constructor(private http: HttpClient, private router: Router, private supabaseService: SupabaseService) {}
  
  get<T>(url:string){
    return this.http.get<any>(url);
  }

  post<T>(url:any, model:any){
    return this.http.post(url, model);
  }

  // Authentication API call Start
  async isLoggedIn(): Promise<boolean> {
    const { data } = await this.supabaseService.client.auth.getSession();
    return !!data.session;
  }

  async register(data: any) {
    const { data: result, error } = await this.supabaseService.client.auth.signUp({
      email: data.Email,
      password: data.Password,
      options: {
        data: {
          username: data.UserName
        }
      }
    });

    if (error) throw error;
    // Create profile row manually
    if (result.user) {
      await this.supabaseService.client.from('profiles').insert({
        id: result.user.id,
        username: data.UserName,
        role: 'user'
      });
    }
    return result;
  }

  async login(data: any) {
    const { data: result, error } = await this.supabaseService.client.auth.signInWithPassword({
      email: data.Email,
      password: data.Password
    });

    if (error) throw error;
    return result;
  }

  async logout() {
    await this.supabaseService.client.auth.signOut();
    this.router.navigate(['/login']);
  }

  async getUser() {
    const { data } = await this.supabaseService.client.auth.getUser();
    return data.user;
  }

  confirm_registration(useridparam: any, codeparam: any) {
    return this.get(this.accountUrl + 'confirmemail?userId=' + useridparam + '&code=' + codeparam);
  }

  async forgotPassword(email: string) {
    const { error } = await this.supabaseService.client.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  resetPassword(model: any) {
    return this.post(this.accountUrl + 'resetpassword', model);
  }

  associateRegister(model: any) {
    return this.http.post<any>(this.accountUrl + 'associate', model);
  }
  // Authentication API call End
}