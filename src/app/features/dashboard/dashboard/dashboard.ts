import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  user: any = null;
  profile: any = null;
  showProfileMenu = false;

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUser();
  }

  // 🔥 GET AUTH USER + PROFILE
  async loadUser() {

    const { data: authData } = await this.supabase.client.auth.getUser();

    if (!authData.user) {
      this.router.navigate(['/login']);
      return;
    }

    this.user = authData.user;

    // get profile table data
    const { data } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', this.user.id)
      .single();

    this.profile = data;
  }

  // 👇 toggle profile dropdown
  toggleProfile() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  // 🔥 GO TO PROFILE PAGE
  goToProfile() {
    this.router.navigate(['/profile']);
  }

  // 🔥 LOGOUT
  async logout() {
    await this.supabase.client.auth.signOut();
    this.router.navigate(['/login']);
  }
}