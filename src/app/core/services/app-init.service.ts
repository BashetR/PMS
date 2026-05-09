import { Injectable, OnDestroy } from "@angular/core";
import { CacheService } from "./cache.service";
import { MenuService } from "./menu.service";
import { PermissionService } from "./permission.service";
import { RoleService } from "./role.service";
import { SupabaseService } from "./supabase.service";
import { UserService } from "./user.service";

@Injectable({ providedIn: 'root' })
export class AppInitService implements OnDestroy {

    private menuDebounce: any;
    private permissionDebounce: any;
    private profileDebounce: any;

    private currentUserId!: string;
    private currentRoleId!: number;

    constructor(
        private cache: CacheService,
        private userService: UserService,
        private roleService: RoleService,
        private permissionService: PermissionService,
        private menuService: MenuService,
        private supabase: SupabaseService
    ) { }

    // =========================
    // INIT APP DATA (ONLY DATA LOADING)
    // =========================
    async loadInitialData() {

        // =========================
        // 1. USER
        // =========================
        const user = await this.supabase.getUser();
        if (!user) return;

        this.currentUserId = user.id;

        // =========================
        // 2. PROFILE (SINGLE SOURCE OF TRUTH CACHE KEY)
        // =========================
        const profile = await this.userService.getProfile(user.id);
        if (!profile) return;

        this.cache.set(`profile_${user.id}`, profile);

        this.currentRoleId = profile.role_id;

        // =========================
        // 3. ROLE
        // =========================
        const role = await this.roleService.getById(profile.role_id);
        this.cache.set(`role_${profile.role_id}`, role);

        // =========================
        // 4. PERMISSIONS
        // =========================
        await this.permissionService.loadByRole(profile.role_id);

        // =========================
        // 5. MENUS
        // =========================
        const menus = await this.menuService.getMenusByUser(user.id);
        this.cache.set(`menus_${user.id}`, menus);

        // =========================
        // 6. REALTIME SYNC
        // =========================
        this.initRealtime();
    }

    // =========================
    // REALTIME SYSTEM (FIXED)
    // =========================
    private initRealtime() {

        // =========================
        // MENUS
        // =========================
        this.supabase.listen('menu', () => {

            clearTimeout(this.menuDebounce);

            this.menuDebounce = setTimeout(async () => {

                const menus = await this.menuService.getMenusByUser(this.currentUserId);

                this.cache.set(`menus_${this.currentUserId}`, menus);

            }, 300);
        });

        // =========================
        // PERMISSIONS
        // =========================
        this.supabase.listen('role_menu_permission_relationship_map', () => {

            clearTimeout(this.permissionDebounce);

            this.permissionDebounce = setTimeout(async () => {

                await this.permissionService.loadByRole(this.currentRoleId);

            }, 300);
        });

        // =========================
        // PROFILE (ROLE CHANGE SAFE)
        // =========================
        this.supabase.listen('profiles', () => {

            clearTimeout(this.profileDebounce);

            this.profileDebounce = setTimeout(async () => {

                const profile =
                    await this.userService.getProfile(this.currentUserId);

                this.cache.set(`profile_${this.currentUserId}`, profile);

                if (profile?.role_id && profile.role_id !== this.currentRoleId) {

                    this.currentRoleId = profile.role_id;

                    const role = await this.roleService.getById(profile.role_id);
                    this.cache.set(`role_${profile.role_id}`, role);

                    await this.permissionService.loadByRole(profile.role_id);
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