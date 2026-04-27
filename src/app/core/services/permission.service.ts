import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {

  // =========================
  // INTERNAL STATE
  // =========================
  private permissions = new Set<string>();

  private permissionsSubject = new BehaviorSubject<string[]>([]);
  permissions$ = this.permissionsSubject.asObservable();

  constructor(private supabase: SupabaseService) { }

  // =========================
  // LOAD BY ROLE
  // =========================
  async loadByRole(roleId: number) {

    this.permissions.clear();

    const { data, error } = await this.supabase.client
      .from('role_menu_permission_relationship_map')
      .select(`
        menu_id,
        permission:permission_id(name)
      `)
      .eq('role_id', roleId);

    if (error) throw error;

    (data || []).forEach((x: any) => {
      const action = this.mapPermission(x.permission?.name);

      if (action) {
        this.permissions.add(`${x.menu_id}_${action}`);
      }
    });

    this.emit();
  }

  // =========================
  // EMIT STATE
  // =========================
  private emit() {
    this.permissionsSubject.next([...this.permissions]);
  }

  // =========================
  // CHECK PERMISSION
  // =========================
  has(menuId: number, action: string): boolean {
    return this.permissions.has(`${menuId}_${action}`);
  }

  // =========================
  // GET MENU PERMISSIONS
  // =========================
  getMenuPermissions(menuId: number): string[] {
    return [...this.permissions]
      .filter(p => p.startsWith(menuId + '_'))
      .map(p => p.split('_')[1]);
  }

  // =========================
  // CLEAR STATE
  // =========================
  clear() {
    this.permissions.clear();
    this.emit();
  }

  // =========================
  // MAPPING FIX
  // =========================
  private mapPermission(name: string): string | null {

    if (!name) return null;

    const map: Record<string, string> = {
      'Is_Add': 'create',
      'Is_View': 'view',
      'Is_Edit': 'edit',
      'Is_Delete': 'delete'
    };

    return map[name] ?? name.toLowerCase();
  }

  // =========================
  // ADMIN FUNCTIONS
  // =========================
  async getPermissions() {

    const { data, error } = await this.supabase.client
      .from('permissions')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  async createPermission(payload: any) {

    const { data, error } = await this.supabase.client
      .from('permissions')
      .insert(payload);

    if (error) throw error;
    return data;
  }

  async updatePermission(id: string, payload: any) {

    const { data, error } = await this.supabase.client
      .from('permissions')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
    return data;
  }

  async deletePermission(id: string) {

    const { error } = await this.supabase.client
      .from('permissions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return true;
  }

  // =========================
  // FILTER (UI HELP)
  // =========================
  filterPermissions(list: any[], search: string) {

    const term = (search || '').toLowerCase().trim();
    if (!term) return list;

    return list.filter(p =>
      (p.name || '').toLowerCase().includes(term)
    );
  }
}