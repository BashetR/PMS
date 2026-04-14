import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  totalUsers: number = 0;
  user: any = null;
  profile: any = null;

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    await this.loadUser();
    await this.loadStats();
  }

  // ✅ LOAD TOTAL USERS
  async loadStats(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('id');

    if (error) {
      console.error('Stats error:', error);
      return;
    }

    this.totalUsers = data?.length ?? 0;
  }

  // ✅ LOAD AUTH USER + PROFILE
  async loadUser(): Promise<void> {
    const { data, error } = await this.supabase.client.auth.getUser();

    if (error || !data?.user) {
      console.error('Auth error:', error);
      this.router.navigate(['/login']);
      return;
    }

    this.user = data.user;

    const { data: profile, error: profileError } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', this.user.id)
      .maybeSingle(); // ✅ SAFE (no crash if null)

    if (profileError) {
      console.error('Profile error:', profileError);
      return;
    }

    // if profile doesn't exist → create it once
    if (!profile) {
      await this.supabase.client
        .from('profiles')
        .upsert({
          id: this.user.id,
          email: this.user.email
        }, { onConflict: 'id' });

      return this.loadUser(); // reload after insert
    }

    this.profile = profile;
  }
}