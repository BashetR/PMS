import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { LoaderService } from '../../core/services/loader.service';

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

  constructor(private supabase: SupabaseService, private router: Router, private loader: LoaderService) { }

  async ngOnInit(): Promise<void> {
    this.loader.show();
    try {
      await this.loadUser();
      await this.loadStats();
    } catch (err) {
      console.error('DASHBOARD INIT ERROR:', err);
    } finally {
      this.loader.hide();
    }
  }

  async loadStats(): Promise<void> {
    try {
      const { data, error } = await this.supabase.client
        .from('profiles')
        .select('id');

      if (error) throw error;
      this.totalUsers = data?.length ?? 0;
    } catch (err) {
      console.error('STATS ERROR:', err);
    }
  }

  async loadUser(): Promise<void> {
    try {
      const { data, error } = await this.supabase.client.auth.getUser();

      if (error || !data?.user) {
        console.error('AUTH ERROR:', error);
        this.router.navigate(['/login']);
        return;
      }
      this.user = data.user;

      const { data: profile, error: profileError } = await this.supabase.client
        .from('profiles')
        .select('*')
        .eq('id', this.user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) {
        const { error: insertError } = await this.supabase.client
          .from('profiles')
          .upsert({
            id: this.user.id,
            email: this.user.email
          }, { onConflict: 'id' });
        if (insertError) throw insertError;
        return this.loadUser();
      }
      this.profile = profile;
    } catch (err) {
      console.error('LOAD USER ERROR:', err);
    }
  }
}