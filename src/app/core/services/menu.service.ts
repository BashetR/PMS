import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CacheService } from './cache.service';
import { Menu } from '../../shared/models/menu.model';

@Injectable({ providedIn: 'root' })

export class MenuService {

    constructor(private supabase: SupabaseService, private cache: CacheService) { }

    async getMenus(roleId: number): Promise<Menu[]> {
        const cacheKey = `menus_role_${roleId}`;
        const cached = this.cache.get<Menu[]>(cacheKey);
        if (cached) return cached;
        const data = await this.getRoleMenuPermissions(roleId);
        const flatMenus = this.transformMenus(data);
        const tree = this.buildTree(flatMenus);
        this.cache.set(cacheKey, tree, 10 * 60 * 1000);
        return tree;
    }

    async getRoleMenuPermissions(roleId: number) {
        const { data, error } = await this.supabase.client
            .from('role_menu_permission_relationship_map')
            .select(`menu_id, permission_id, menu (id, menu_name, route, parent_id, order_no, icon, status, menu_type)`).eq('role_id', roleId);

        if (error) throw error;
        return data || [];
    }

    transformMenus(data: any[]): Menu[] {
        const map = new Map<number, Menu>();
        data.forEach(row => {
            const m = row.menu;
            if (!m || !m.status) return;
            if (!map.has(m.id)) {
                map.set(m.id, {
                    ...m,
                    permission_list: [],
                    children: []
                });
            }
            map.get(m.id)!.permission_list!.push(row.permission_id);
        });
        return Array.from(map.values());
    }

    private buildTree(menus: Menu[]): Menu[] {
        const map = new Map<number, Menu>();
        const tree: Menu[] = [];
        menus.forEach(menu => {
            map.set(menu.id, { ...menu, children: [] });
        });

        menus.forEach(menu => {
            const current = map.get(menu.id)!;
            if (menu.parent_id && map.has(menu.parent_id)) {
                map.get(menu.parent_id)!.children!.push(current);
            } else {
                tree.push(current);
            }
        });

        const sort = (items: Menu[]) => {
            items.sort((a, b) => (a.order_no ?? 0) - (b.order_no ?? 0));
            items.forEach(i => i.children && sort(i.children));
        };

        sort(tree);
        return tree;
    }

    async getMenusByUser(userId: string): Promise<Menu[]> {
        const cacheKey = `menus_user_${userId}`;
        const cached = this.cache.get<Menu[]>(cacheKey);
        if (cached) return cached;
        const { data: profile, error: pError } = await this.supabase.client.from('profiles').select('role_id').eq('id', userId).single();

        if (pError) throw pError;
        if (!profile?.role_id) return [];
        const menus = await this.getMenusByRole(profile.role_id);
        this.cache.set(cacheKey, menus, 10 * 60 * 1000);
        return menus;
    }

    async getMenusByRole(roleId: number): Promise<Menu[]> {
        const { data, error } = await this.supabase.client
            .from('role_menu_permission_relationship_map')
            .select(`menu:menu_id (id, menu_name, route, icon, parent_id, order_no, menu_type, status)`).eq('role_id', roleId);

        if (error) throw error;
        // let menus: Menu[] = (data || [])
        //     .map(x => x.menu)
        //     .filter(Boolean);

        let menus: Menu[] = (data || [])
            .flatMap(x =>
                Array.isArray(x.menu) ? x.menu : [x.menu]
            )
            .filter(Boolean)
            .map(menu => ({
                ...menu,
                permission_list: [],
                children: []
            }));

        const { data: dashboard } = await this.supabase.client.from('menu').select('*').eq('slug', 'dashboard').single();

        if (dashboard) {
            dashboard.order_no = -1;
            menus.unshift(dashboard);
        }

        menus = this.uniqueById(menus);
        menus = await this.includeParentMenus(menus);
        menus.sort((a, b) => (a.order_no ?? 0) - (b.order_no ?? 0));
        return this.buildTree(menus);
    }

    private async includeParentMenus(menus: Menu[]): Promise<Menu[]> {
        const cacheKey = 'all_menus_full';
        let allMenus = this.cache.get<Menu[]>(cacheKey);
        if (!allMenus) {
            const { data } = await this.supabase.client.from('menu').select('*');
            allMenus = data || [];
            this.cache.set(cacheKey, allMenus, 10 * 60 * 1000);
        }

        const map = new Map<number, Menu>(
            (allMenus ?? []).map(m => [m.id, m])
        );

        const result = new Map<number, Menu>();
        menus.forEach(menu => {
            let current: Menu | undefined = menu;
            while (current) {
                result.set(current.id, current);
                if (!current.parent_id) break;
                current = map.get(current.parent_id);
            }
        });
        return Array.from(result.values());
    }

    private uniqueById(menus: Menu[]): Menu[] {
        const map = new Map<number, Menu>();
        menus.forEach(m => map.set(m.id, m));
        return Array.from(map.values());
    }

    async getMenusWithPermissions(userId: string) {
        const { data, error } = await this.supabase.client.from('menu_permissions').select(`menu_id, permission_id, menus (id, menu_name, route, icon, parent_id)`).eq('user_id', userId);
        if (error) throw error;
        return data || [];
    }
}