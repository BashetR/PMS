import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CacheService } from './cache.service';

@Injectable({
    providedIn: 'root'
})
export class MenuService {

    constructor(
        private supabase: SupabaseService,
        private cache: CacheService
    ) { }

    // =========================
    // GET ALL MENUS (ADMIN)
    // =========================
    async getAll() {

        const cacheKey = 'all_menus';

        const cached = this.cache.get<any[]>(cacheKey);
        if (cached) return cached;

        const { data, error } = await this.supabase.client
            .from('menu')
            .select('*')
            .order('order_no', { ascending: true });

        if (error) throw error;

        this.cache.set(cacheKey, data || []);

        return data ?? [];
    }

    // =========================
    // CREATE MENU
    // =========================
    async create(menu: any) {

        const { data, error } = await this.supabase.client
            .from('menu')
            .insert(this.transformMenu(menu))
            .select()
            .single();

        if (error) throw error;

        this.cache.remove('all_menus');

        return data;
    }

    // =========================
    // UPDATE MENU
    // =========================
    async update(id: number, menu: any) {

        const { data, error } = await this.supabase.client
            .from('menu')
            .update(this.transformMenu(menu))
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        this.cache.remove('all_menus');
        this.cache.remove('menus_user_*'); // optional pattern reset

        return data;
    }

    // =========================
    // DELETE MENU
    // =========================
    async delete(id: number) {

        const { error } = await this.supabase.client
            .from('menu')
            .delete()
            .eq('id', id);

        if (error) throw error;

        this.cache.remove('all_menus');
        this.cache.remove('menus_user_*');

        return true;
    }

    // =========================
    // GET MENUS BY USER (OPTIMIZED)
    // =========================
    async getMenusByUser(userId: string) {

        const cacheKey = `menus_user_${userId}`;

        const cached = this.cache.get<any[]>(cacheKey);
        if (cached) return cached;

        // STEP 1: PROFILE → ROLE
        const { data: profile, error: pError } = await this.supabase.client
            .from('profiles')
            .select('role_id')
            .eq('id', userId)
            .single();

        if (pError) throw pError;
        if (!profile?.role_id) return [];

        // STEP 2: ROLE BASED MENUS
        const { data, error } = await this.supabase.client
            .from('role_menu_permission_relationship_map')
            .select(`
                menu:menu_id (
                    id,
                    menu_name,
                    route,
                    icon,
                    parent_id,
                    order_no
                )
            `)
            .eq('role_id', profile.role_id);

        if (error) throw error;

        const flatMenus = (data || [])
            .map(x => x.menu)
            .filter(Boolean);

        const uniqueMenus = this.uniqueById(flatMenus);

        const tree = this.buildTree(uniqueMenus);

        this.cache.set(cacheKey, tree);

        return tree;
    }

    async getMenusByRole(roleId: number) {

        // 1. Get allowed menus from mapping table
        const { data, error } = await this.supabase.client
            .from('role_menu_permission_relationship_map')
            .select(`menu:menu_id (
                        id,
                        menu_name,
                        route,
                        icon,
                        parent_id,
                        order_no,
                        menu_type,
                        status
                    )`)
            .eq('role_id', roleId);

        if (error) throw error;

        let menus = (data || [])
            .map(x => x.menu)
            .filter(Boolean);

        // 2. ALWAYS include Dashboard
        const { data: dashboard } = await this.supabase.client
            .from('menu')
            .select('*')
            .eq('slug', 'dashboard')
            .single();

        if (dashboard) {
            dashboard.order_no = -1;
            // menus.push(dashboard);
            menus.unshift(dashboard);
        }

        // 3. Remove duplicates
        menus = this.uniqueById(menus);

        // 4. Add parent menus automatically (IMPORTANT FIX)
        menus = await this.includeParentMenus(menus);

        menus.sort((a: any, b: any) => (a.order_no ?? 0) - (b.order_no ?? 0));

        // 5. Build tree
        return this.buildTree(menus);
    }

    private async includeParentMenus(menus: any[]) {

        const { data: allMenus } = await this.supabase.client
            .from('menu')
            .select('*');

        const map = new Map((allMenus ?? []).map(m => [m.id, m]));

        const result = new Map<number, any>();

        menus.forEach(menu => {
            let current = menu;

            while (current) {
                result.set(current.id, current);

                if (!current.parent_id) break;

                current = map.get(current.parent_id);
            }
        });

        return Array.from(result.values());
    }

    // =========================
    // SAFE DEDUPLICATION
    // =========================
    private uniqueById(menus: any[]) {
        const map = new Map<number, any>();
        menus.forEach(m => map.set(m.id, m));
        return Array.from(map.values());
    }

    // =========================
    // TREE BUILDER (O(n))
    // =========================
    private buildTree(menus: any[]) {

        const map = new Map<number, any>();
        const tree: any[] = [];

        menus.forEach(m => {
            m.children = [];
            map.set(m.id, m);
        });

        menus.forEach(m => {
            if (m.parent_id && map.has(m.parent_id)) {
                map.get(m.parent_id).children.push(m);
            } else {
                tree.push(m);
            }
        });

        // menus.sort((a: any, b: any) => a.order_no - b.order_no);

        // const sortTree = (nodes: any[]) => {
        //     nodes.sort((a, b) => a.order_no - b.order_no);
        //     nodes.forEach(n => {
        //         if (n.children?.length) {
        //             sortTree(n.children);
        //         }
        //     });
        // };

        // sortTree(tree);

        return tree;
    }

    // =========================
    // TRANSFORMER
    // =========================
    private transformMenu(menu: any) {

        const payload = { ...menu };

        if (payload.permission_list) {
            payload.permission_list = payload.permission_list.map((id: number) => ({
                permission_id: id
            }));
        }

        if (payload.menu_type === 'menu') {
            payload.parent_id = null;
        }

        return payload;
    }
}