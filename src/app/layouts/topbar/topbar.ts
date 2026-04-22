import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../core/services/loader.service';

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
  userId: string | null = null;
  user: any;
  menus: any[] = [];
  treeMenus: any[] = [];
  openMenuId: number | null = null;
  userDropdownOpen = false;

  constructor(private supabase: SupabaseService, private router: Router, private loader: LoaderService) { }

  async ngOnInit() {
    this.loader.show();
    try {
      await this.loadUser();
      await this.loadMenus();
    } catch (err) {
      console.error('TOPBAR INIT ERROR:', err);
    } finally {
      this.loader.hide();
    }
  }

  async loadUser(): Promise<void> {
    try {
      const { data: auth, error } = await this.supabase.client.auth.getUser();
      if (error || !auth?.user) return;
      this.user = auth.user;
      this.userId = this.user.id;
      this.userEmail = this.user.email || '';

      const { data: profile, error: profileError } = await this.supabase.client
        .from('profiles')
        .select('*')
        .eq('id', this.user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (profile) {
        this.userName = profile.username || profile.full_name || 'User';
        this.avatar = profile.avatar_url || this.avatar;
      }
    } catch (err) {
      console.error('LOAD USER ERROR:', err);
    }
  }

  async loadMenus() {
    try {
      const { data, error } = await this.supabase.client
        .from('menu')
        .select('*')
        .eq('status', true)
        .order('order_no', { ascending: true });

      if (error) throw error;
      this.menus = data || [];
      this.buildTree();
    } catch (err) {
      console.error('MENU LOAD ERROR:', err);
    }
  }

  buildTree() {
    const map = new Map<number, any>();
    this.treeMenus = [];
    this.menus.forEach(menu => {
      map.set(Number(menu.id), { ...menu, children: [] });
    });
    map.forEach(menu => {
      const parentId =
        menu.parent_id !== null && menu.parent_id !== undefined
          ? Number(menu.parent_id)
          : null;

      if (parentId && map.has(parentId)) {
        map.get(parentId).children.push(menu);
      } else {
        this.treeMenus.push(menu);
      }
    });
  }

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
      await this.supabase.client.auth.signOut();
      this.router.navigateByUrl('/login');
    } catch (err) {
      console.error('LOGOUT ERROR:', err);
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