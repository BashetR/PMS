import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class RolePermissionService {

    constructor(private supabase: SupabaseService) { }

    // =========================
    // LOAD INITIAL DATA (FIXED + OPTIMIZED)
    // =========================
    async getInitialData() {

        const { data: roles, error: rolesError } = await this.supabase.client
            .from('role')
            .select('*')
            .order('role_name');

        const { data: menus, error: menusError } = await this.supabase.client
            .from('menu')
            .select('*')
            .eq('status', true)
            .order('order_no');

        const { data: permissions, error: permError } = await this.supabase.client
            .from('permissions')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (rolesError) throw rolesError;
        if (menusError) throw menusError;
        if (permError) throw permError;

        return {
            roles: roles || [],
            menus: menus || [],
            permissions: permissions || []
        };
    }

    // =========================
    // GET PERMISSIONS FOR MENU (FIXED)
    // =========================
    async getMenuPermissions(menuId: number) {

        const { data, error } = await this.supabase.client
            .from('role_menu_permission_relationship_map')
            .select('permission_id')
            .eq('menu_id', menuId);

        if (error) throw error;

        return data || [];
    }

    // =========================
    // GET ROLE + MENU MAPPINGS
    // =========================
    async getRoleMappings(roleId: number, menuId: number) {

        const { data, error } = await this.supabase.client
            .from('role_menu_permission_relationship_map')
            .select('permission_id')
            .eq('role_id', roleId)
            .eq('menu_id', menuId);

        if (error) throw error;

        return data || [];
    }

    // =========================
    // SAVE MAPPINGS (FIXED + SAFE)
    // =========================
    async saveMappings(
        roleId: number,
        menuId: number,
        permissionIds: string[]
    ) {

        // 1. delete old
        const { error: deleteError } = await this.supabase.client
            .from('role_menu_permission_relationship_map')
            .delete()
            .eq('role_id', roleId)
            .eq('menu_id', menuId);

        if (deleteError) throw deleteError;

        // 2. insert new
        if (permissionIds.length === 0) return;

        const rows = permissionIds.map(permissionId => ({
            role_id: roleId,
            menu_id: menuId,
            permission_id: permissionId
        }));

        const { error: insertError } = await this.supabase.client
            .from('role_menu_permission_relationship_map')
            .insert(rows);

        if (insertError) throw insertError;
    }

    // =========================
    // OPTIONAL: BULK LOAD (PERFORMANCE UPGRADE)
    // =========================
    async getFullRolePermissionMatrix(roleId: number) {

        const { data, error } = await this.supabase.client
            .from('role_menu_permission_relationship_map')
            .select('menu_id, permission_id')
            .eq('role_id', roleId);

        if (error) throw error;

        return data || [];
    }
}