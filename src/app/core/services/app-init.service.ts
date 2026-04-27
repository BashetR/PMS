import { Injectable, OnDestroy } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { MenuService } from './menu.service';
import { PermissionService } from './permission.service';
import { RoleService } from './role.service';
import { UserService } from './user.service';
import { CacheService } from './cache.service';
import { IdleService } from './idle.service';

@Injectable({ providedIn: 'root' })
export class AppInitService implements OnDestroy {

    private menuDebounce: any;
    private permissionDebounce: any;
    private profileDebounce: any;

    constructor(
        private cache: CacheService,
        private userService: UserService,
        private roleService: RoleService,
        private permissionService: PermissionService,
        private menuService: MenuService,
        private supabase: SupabaseService,
        private idleService: IdleService
    ) { }

    // =========================
    // INIT APP DATA
    // =========================
    async loadInitialData() {
        this.idleService.startWatching();
        // =========================
        // STEP 1: AUTH USER
        // =========================
        const user = await this.supabase.getUser();
        if (!user) return;

        const userId = user.id;

        // =========================
        // STEP 2: PROFILE (SINGLE SOURCE OF TRUTH)
        // =========================
        const profile = await this.userService.getProfile(userId);
        if (!profile) return;

        this.cache.set('profile', profile);

        const roleId = profile.role_id;

        // =========================
        // STEP 3: ROLE (FIXED - NO DUPLICATION)
        // =========================
        const role = await this.roleService.getById(roleId);
        this.cache.set('role', role);

        // =========================
        // STEP 4: PERMISSIONS
        // =========================
        await this.permissionService.loadByRole(roleId);

        // =========================
        // STEP 5: MENUS
        // =========================
        const menus = await this.menuService.getMenusByUser(userId);
        this.cache.set('menus', menus);

        // =========================
        // STEP 6: REALTIME SYNC
        // =========================
        this.initRealtime(userId, roleId);
    }

    // =========================
    // REALTIME SYSTEM
    // =========================
    private initRealtime(userId: string, roleId: number) {

        // =========================
        // MENUS
        // =========================
        this.supabase.listen('menu', () => {
            clearTimeout(this.menuDebounce);

            this.menuDebounce = setTimeout(async () => {
                const menus = await this.menuService.getMenusByUser(userId);
                this.cache.set('menus', menus);
            }, 300);
        });

        // =========================
        // PERMISSIONS (IMPORTANT)
        // =========================
        this.supabase.listen('role_menu_permission_relationship_map', () => {
            clearTimeout(this.permissionDebounce);

            this.permissionDebounce = setTimeout(async () => {
                await this.permissionService.loadByRole(roleId);
            }, 300);
        });

        // =========================
        // PROFILE (ROLE CHANGE SAFE)
        // =========================
        this.supabase.listen('profiles', () => {
            clearTimeout(this.profileDebounce);

            this.profileDebounce = setTimeout(async () => {

                const profile = await this.userService.getProfile(userId);
                this.cache.set('profile', profile);

                if (profile?.role_id) {

                    const newRoleId = profile.role_id;

                    // update role
                    const role = await this.roleService.getById(newRoleId);
                    this.cache.set('role', role);

                    // reload permissions
                    await this.permissionService.loadByRole(newRoleId);

                    // update local reference for realtime
                    roleId = newRoleId;
                }

            }, 300);
        });
    }

    // =========================
    // CLEANUP
    // =========================
    ngOnDestroy() {
        this.supabase.removeAllListeners?.();

        clearTimeout(this.menuDebounce);
        clearTimeout(this.permissionDebounce);
        clearTimeout(this.profileDebounce);
    }
}