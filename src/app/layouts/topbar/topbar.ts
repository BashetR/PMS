import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../core/services/loader.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { MenuService } from '../../core/services/menu.service';
import { Auth } from '../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css'
})
export class Topbar implements OnInit {

  userName: string = 'User';
  userEmail: string = '';
  avatar: string = 'assets/images/profile_Image/avt.png';

  user: any;
  userId: string | null = null;
  roleId: number | null = null;

  treeMenus: any[] = [];
  openMenuId: number | null = null;
  userDropdownOpen = false;

  constructor(
    private supabase: SupabaseService,
    private auth: Auth,
    private menuService: MenuService,
    private router: Router,
    private loader: LoaderService
  ) { }

  async ngOnInit() {
    this.loader.show();

    try {
      await this.loadUser();

      if (this.roleId) {
        await this.loadMenusByRole(this.roleId);
      }

    } catch (err) {
      console.error('TOPBAR INIT ERROR:', err);
    } finally {
      this.loader.hide();
    }
  }

  // =========================
  // USER + ROLE (FIXED)
  // =========================
  async loadUser(): Promise<void> {

    const user = await this.supabase.getUser();
    if (!user) return;

    this.user = user;
    this.userId = user.id;
    this.userEmail = user.email || '';

    const { data: profile } = await this.supabase.client
      .from('profiles')
      .select('username, full_name, avatar_url, role_id')
      .eq('id', this.userId)
      .maybeSingle();

    if (profile) {
      this.userName = profile.username || profile.full_name || 'User';
      this.avatar = profile.avatar_url || this.avatar;
      this.roleId = profile.role_id;   // ✅ IMPORTANT
    }
  }

  // =========================
  // ROLE BASED MENU (FIXED)
  // =========================
  async loadMenusByRole(roleId: number) {

    const tree = await this.menuService.getMenusByRole(roleId);

    this.treeMenus = tree || [];
  }

  // =========================
  // UI
  // =========================
  toggleMenu(id: number) {
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  closeMenus() {
    this.openMenuId = null;
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  goProfile(): void {
    this.closeMenus();
    this.router.navigateByUrl('/profile');
  }

  async logout(): Promise<void> {
    this.loader.show();
    try {
      this.closeMenus();
      await this.auth.logout();
      this.router.navigateByUrl('/login');
    } finally {
      this.loader.hide();
    }
  }

  toggleUserDropdown() {
    this.userDropdownOpen = !this.userDropdownOpen;
  }

  closeAll() {
    this.userDropdownOpen = false;
    this.openMenuId = null;
  }
}