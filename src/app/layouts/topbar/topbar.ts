import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { CommonModule } from '@angular/common';

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
  private userId: string | null = null;
  menus: any[] = [];
  treeMenus: any[] = [];
  user: any;
  userPermissions: string[] = [];

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.loadUser();
    await this.loadMenus();
  }

  async loadUser(): Promise<void> {
    const { data: auth } = await this.supabase.client.auth.getUser();
    if (!auth.user) return;
    this.user = auth.user;

    this.userId = this.user.id;
    this.userEmail = this.user.email || '';

    const { data: profile } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', this.user.id)
      .maybeSingle();

    if (profile) {
      this.userName = profile.username || profile.full_name || 'User';
      this.avatar = profile.avatar_url || this.avatar;
    }

    if (!profile?.role_id) return;
    const { data: rolePerms } = await this.supabase.client
      .from('role_permissions')
      .select('permission_id')
      .eq('role_id', profile.role_id);

    this.userPermissions = rolePerms?.map(x => x.permission_id) || [];
  }

  async loadMenus() {
    const { data } = await this.supabase.client
      .from('menu_permissions')
      .select(`
      menu_id,
      permission_id,
      menus(*)
    `);

    const allowedMenus = data
      ?.filter(mp => this.userPermissions.includes(mp.permission_id))
      .map(mp => mp.menus)
      .flat() || [];

    this.menus = this.removeDuplicates(allowedMenus);

    this.buildTree();
  }

  removeDuplicates(arr: any[]) {
    const map = new Map();
    arr.forEach(m => map.set(m.id, m));
    return Array.from(map.values());
  }

  buildTree() {
    const map = new Map();
    this.menus.forEach(m => map.set(m.id, { ...m, children: [] }));
    this.treeMenus = [];
    map.forEach(menu => {
      if (menu.parent_id) {
        const parent = map.get(menu.parent_id);
        parent?.children.push(menu);
      } else {
        this.treeMenus.push(menu);
      }
    });
  }

  isActive(route: string) {
    return this.router.url === route;
  }

  goProfile(): void {
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