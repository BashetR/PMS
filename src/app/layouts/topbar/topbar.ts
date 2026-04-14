import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css'
})

export class Topbar implements OnInit {
  userName: string = 'User';
  userEmail: string = '';
  avatar: string = 'assets/images/profile_Image/avt.png';
  private userId: string | null = null;

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUser();
  }

  async loadUser(): Promise<void> {

    const { data: { user } } = await this.supabase.client.auth.getUser();

    if (!user) return;

    this.userId = user.id;
    this.userEmail = user.email || '';

    const { data: profile } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      this.userName = profile.username || profile.full_name || 'User';
      this.avatar = profile.avatar_url || this.avatar;
    }
  }

  goProfile(): void {

    // close dropdown first (IMPORTANT FIX)
    this.closeDropdown();

    // navigate safely
    this.router.navigateByUrl('/profile');
  }

  async logout(): Promise<void> {

    this.closeDropdown();

    await this.supabase.client.auth.signOut();
    this.router.navigateByUrl('/login');
  }

  closeDropdown(): void {
    document.querySelectorAll('.dropdown-menu.show')
      .forEach(el => el.classList.remove('show'));
  }
}