import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { FormsModule } from '@angular/forms';
import { LoaderService } from '../../core/services/loader.service';

@Component({
  selector: 'app-role-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-permissions.html',
  styleUrl: './role-permissions.css'
})

export class RolePermissions implements OnInit {
  roles: any[] = [];
  menus: any[] = [];
  permissions: any[] = [];
  filteredPermissions: any[] = [];
  selectedRole: number | null = null;
  selectedMenu: number | null = null;
  assignedPermissions: Set<string> = new Set();

  constructor(private supabase: SupabaseService, private loader: LoaderService) { }

  async ngOnInit() {
    await this.loadInitialData();
  }

  async loadInitialData() {
    this.loader.show();
    try {
      const [rolesRes, menusRes, permRes] = await Promise.all([
        this.supabase.client.from('role').select('*').order('role_name'),
        this.supabase.client.from('menu').select('*').order('menu_name'),
        this.supabase.client.from('permissions').select('*').order('name')
      ]);

      if (rolesRes.error) throw rolesRes.error;
      if (menusRes.error) throw menusRes.error;
      if (permRes.error) throw permRes.error;
      this.roles = rolesRes.data || [];
      this.menus = menusRes.data || [];
      this.permissions = permRes.data || [];
    } catch (err) {
      console.error('LOAD INITIAL ERROR:', err);
    } finally {
      this.loader.hide();
    }
  }

  async onMenuChange() {
    this.filteredPermissions = [];
    this.assignedPermissions.clear();
    if (!this.selectedMenu) return;
    this.loader.show();
    try {
      const { data, error } = await this.supabase.client
        .from('menu')
        .select('permission_list')
        .eq('id', this.selectedMenu)
        .single();

      if (error) throw error;
      const permissionIds: string[] = (data?.permission_list || [])
        .filter((x: any) => x && x.permission_id)
        .map((x: any) => x.permission_id);

      if (!permissionIds.length) {
        this.filteredPermissions = [];
        return;
      }

      const { data: perms, error: permError } = await this.supabase.client
        .from('permissions')
        .select('*')
        .in('id', permissionIds);

      if (permError) throw permError;
      this.filteredPermissions = perms || [];
      await this.loadRoleMappings();
    } catch (err) {
      console.error('MENU CHANGE ERROR:', err);
    } finally {
      this.loader.hide();
    }
  }

  async loadRoleMappings() {
    if (!this.selectedRole || !this.selectedMenu) return;
    try {
      const { data, error } = await this.supabase.client
        .from('role_menu_permission_relationship_map')
        .select('permission_id')
        .eq('role_id', this.selectedRole)
        .eq('menu_id', this.selectedMenu);

      if (error) throw error;
      const ids = (data || []).map(x => x.permission_id);
      this.assignedPermissions = new Set(ids);
    } catch (err) {
      console.error('LOAD ROLE MAPPING ERROR:', err);
    }
  }

  togglePermission(permissionId: string, event: any) {
    if (event.target.checked) {
      this.assignedPermissions.add(permissionId);
    } else {
      this.assignedPermissions.delete(permissionId);
    }
  }

  isChecked(permissionId: string): boolean {
    return this.assignedPermissions.has(permissionId);
  }

  async saveAll() {
    if (!this.selectedRole || !this.selectedMenu) return;
    this.loader.show();
    try {
      const { error: deleteError } = await this.supabase.client
        .from('role_menu_permission_relationship_map')
        .delete()
        .eq('role_id', this.selectedRole)
        .eq('menu_id', this.selectedMenu);

      if (deleteError) throw deleteError;
      const rows = Array.from(this.assignedPermissions).map(id => ({
        role_id: this.selectedRole,
        menu_id: this.selectedMenu,
        permission_id: id
      }));

      if (rows.length) {
        const { error: insertError } = await this.supabase.client
          .from('role_menu_permission_relationship_map')
          .insert(rows);
        if (insertError) throw insertError;
      }
      alert('Permissions saved successfully');
    } catch (err) {
      console.error('SAVE ERROR:', err);
      alert('Save failed');
    } finally {
      this.loader.hide();
    }
  }
}