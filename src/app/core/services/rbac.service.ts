import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { UserService } from './user.service';
import { RoleService } from './role.service';
import { PermissionService } from './permission.service';
import { MenuService } from './menu.service';

export interface RbacPermission {
    menu_id: number;
    action: string;
}

@Injectable({ providedIn: 'root' })
export class RbacService {

    // 🔥 STATE (single source of truth)
    private _user = signal<any | null>(null);
    private _profile = signal<any | null>(null);
    private _role = signal<any | null>(null);
    private _permissions = signal<RbacPermission[]>([]);
    private _menus = signal<any[]>([]);
    private _initialized = signal(false);

    // ✅ PUBLIC READ-ONLY STATE
    user = computed(() => this._user());
    profile = computed(() => this._profile());
    role = computed(() => this._role());
    permissions = computed(() => this._permissions());
    menus = computed(() => this._menus());
    isInitialized = computed(() => this._initialized());

    constructor(
        private supabase: SupabaseService,
        private userService: UserService,
        private roleService: RoleService,
        private permissionService: PermissionService,
        private menuService: MenuService
    ) { }

    // 🚀 APP INITIALIZER ENTRY POINT
    async init(): Promise<void> {
        try {
            // 1️⃣ Restore session
            const session = await this.supabase.getSession();

            if (!session) {
                this._initialized.set(true);
                return;
            }

            // 2️⃣ Get user
            const user = await this.supabase.getUser();
            if (!user) {
                this._initialized.set(true);
                return;
            }

            this._user.set(user);

            // 3️⃣ Load profile
            const profile = await this.userService.getProfile(user.id);
            if (!profile) {
                throw new Error('Profile not found');
            }

            this._profile.set(profile);

            // 4️⃣ Load role
            const role = await this.roleService.getById(profile.role_id);
            this._role.set(role);

            // 5️⃣ Load permissions
            const permissions = await this.permissionService.getByRole(profile.role_id);
            this._permissions.set(permissions || []);

            // 6️⃣ Load menus
            const menus = await this.menuService.getMenusByUser(user.id);
            this._menus.set(menus || []);

            // ✅ DONE
            this._initialized.set(true);

        } catch (error) {
            console.error('RBAC initialization failed:', error);
            this._initialized.set(true);
        }
    }

    // 🔐 CHECK PERMISSION (menu-based)
    hasPermission(menuId: number, action: string): boolean {
        if (!menuId || !action) return false;

        return this._permissions().some(p =>
            p.menu_id === menuId && p.action === action
        );
    }

    // 🔐 CHECK MULTIPLE PERMISSIONS
    hasAnyPermission(menuId: number, actions: string[]): boolean {
        return actions.some(action => this.hasPermission(menuId, action));
    }

    // 🔐 GLOBAL CHECK (no menu)
    hasGlobalPermission(action: string): boolean {
        return this._permissions().some(p => p.action === action);
    }

    // 🔐 ROLE CHECK (optional)
    hasRole(roleSlug: string | string[]): boolean {
        const currentRole = this._role()?.slug;

        if (!currentRole) return false;

        if (Array.isArray(roleSlug)) {
            return roleSlug.includes(currentRole);
        }

        return currentRole === roleSlug;
    }

    // 🔄 REFRESH PERMISSIONS (realtime / manual)
    async refreshPermissions(): Promise<void> {
        const roleId = this._profile()?.role_id;
        if (!roleId) return;

        const permissions = await this.permissionService.getByRole(roleId);
        this._permissions.set(permissions || []);
    }

    // 🔄 REFRESH MENUS
    async refreshMenus(): Promise<void> {
        const userId = this._user()?.id;
        if (!userId) return;

        const menus = await this.menuService.getMenusByUser(userId);
        this._menus.set(menus || []);
    }

    // 🔄 FULL REFRESH (after role change)
    async reload(): Promise<void> {
        this._initialized.set(false);
        await this.init();
    }

    // 🔓 CLEAR (logout)
    clear(): void {
        this._user.set(null);
        this._profile.set(null);
        this._role.set(null);
        this._permissions.set([]);
        this._menus.set([]);
        this._initialized.set(false);
    }
}