import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-role-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-permissions.html',
  styleUrl: './role-permissions.css'
})

export class RolePermissions implements OnInit {
  roles: any[] = [];
  permissions: any[] = [];
  selectedRole: string | null = null;
  assignedPermissions: string[] = [];

  loading = false;

  constructor(private supabase: SupabaseService) { }

  async ngOnInit() {
    await this.loadRoles();
    await this.loadPermissions();
  }

  async loadRoles() {
    const { data } = await this.supabase.client
      .from('roles')
      .select('*');

    this.roles = data || [];
  }

  async loadPermissions() {
    const { data } = await this.supabase.client
      .from('permissions')
      .select('*');

    this.permissions = data || [];
  }

  async onRoleChange() {
    if (!this.selectedRole) return;

    const { data } = await this.supabase.client
      .from('role_permissions')
      .select('permission_id')
      .eq('role_id', this.selectedRole);

    this.assignedPermissions = data?.map(x => x.permission_id) || [];
  }

  togglePermission(id: string) {
    if (this.assignedPermissions.includes(id)) {
      this.assignedPermissions =
        this.assignedPermissions.filter(p => p !== id);
    } else {
      this.assignedPermissions.push(id);
    }
  }

  async save() {
    if (!this.selectedRole) return;

    this.loading = true;

    // delete old
    await this.supabase.client
      .from('role_permissions')
      .delete()
      .eq('role_id', this.selectedRole);

    // insert new
    const payload = this.assignedPermissions.map(p => ({
      role_id: this.selectedRole,
      permission_id: p
    }));

    if (payload.length > 0) {
      await this.supabase.client
        .from('role_permissions')
        .insert(payload);
    }

    this.loading = false;
    alert('Permissions assigned successfully');
  }
}