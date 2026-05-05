import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {

  constructor(private supabase: SupabaseService) { }

  async getByRole(roleId: number): Promise<{ menu_id: number; action: string }[]> {
    const { data, error } = await this.supabase.client
      .from('role_menu_permission_relationship_map')
      .select(`menu_id, permission:permission_id(name)`)
      .eq('role_id', roleId);

    if (error) throw error;

    return (data || [])
      .map((x: any) => {
        const action = this.mapPermission(x.permission?.name);

        if (!action) return null; // 🚫 filter later

        return {
          menu_id: Number(x.menu_id),
          action
        };
      })
      .filter((p): p is { menu_id: number; action: string } => p !== null); // ✅ TYPE GUARD
  }

  async getAllPermissions() {
    const { data, error } = await this.supabase.client
      .from('permissions')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    return data || [];
  }

  private mapPermission(name: string): string | null {
    if (!name) return null;

    const map: Record<string, string> = {
      'Is_Add': 'create',
      'Is_View': 'view',
      'Is_Edit': 'edit',
      'Is_Delete': 'delete',
      'Assign_Permission': 'assign'
    };

    return map[name] ?? name.toLowerCase();
  }
}