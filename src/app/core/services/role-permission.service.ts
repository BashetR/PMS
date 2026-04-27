import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class RolePermissionService {

    constructor(private supabase: SupabaseService) { }

    // =========================
    // LOAD INITIAL DATA
    // =========================
    async getInitialData() {
        const [rolesRes, menusRes, permRes] = await Promise.all([
            this.supabase.client.from('role').select('*').order('role_name'),
            this.supabase.client.from('menu').select('*').order('menu_name'),
            this.supabase.client.from('permissions').select('*').order('name')
        ]);

        if (rolesRes.error) throw rolesRes.error;
        if (menusRes.error) throw menusRes.error;
        if (permRes.error) throw permRes.error;

        return {
            roles: rolesRes.data || [],
            menus: menusRes.data || [],
            permissions: permRes.data || []
        };
    }

    // =========================
    // GET MENU PERMISSIONS
    // =========================
    async getMenuPermissions(menuId: number) {
        const { data, error } = await this.supabase.client
            .from('menu')
            .select('permission_list')
            .eq('id', menuId)
            .single();

        if (error) throw error;

        return data?.permission_list || [];
    }

    // =========================
    // GET ROLE MAPPINGS
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
    // SAVE MAPPINGS
    // =========================
    async saveMappings(roleId: number, menuId: number, permissionIds: string[]) {

        await this.supabase.client
            .from('role_menu_permission_relationship_map')
            .delete()
            .eq('role_id', roleId)
            .eq('menu_id', menuId);

        const rows = permissionIds.map(id => ({
            role_id: roleId,
            menu_id: menuId,
            permission_id: id
        }));

        if (rows.length) {
            const { error } = await this.supabase.client
                .from('role_menu_permission_relationship_map')
                .insert(rows);

            if (error) throw error;
        }
    }
}