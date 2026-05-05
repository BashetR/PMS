import { Injectable, OnDestroy } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { MenuService } from './menu.service';
import { PermissionService } from './permission.service';
import { RoleService } from './role.service';
import { UserService } from './user.service';
import { CacheService } from './cache.service';
import { IdleService } from './idle.service';
import { UserCrudService } from './crud/user-crud.service';
import { MenuCrudService } from './crud/menu-crud.service';
import { PermissionCrudService } from './crud/permission-crud.service';
import { RoleCrudService } from './crud/role-crud.service';

@Injectable({ providedIn: 'root' })

export class AppInitService implements OnDestroy {
    private menuDebounce: any;
    private permissionDebounce: any;
    private profileDebounce: any;

    constructor(private cache: CacheService, private userService: UserService, private roleService: RoleService, private permissionService: PermissionService, private menuService: MenuService, private supabase: SupabaseService, private idleService: IdleService, private permissionCrud: PermissionCrudService, private roleCrud: RoleCrudService, private menuCrud: MenuCrudService, private userCrud: UserCrudService) { }

    async init() {
        setTimeout(() => {
            this.permissionCrud.getAll({ page: 1, pageSize: 10, silent: true });
            this.roleCrud.getAll({ page: 1, pageSize: 10, silent: true });
            this.menuCrud.getAll({ page: 1, pageSize: 10, silent: true });
            this.userCrud.getAll({ page: 1, pageSize: 10, silent: true });
        }, 2000);
    }

    async loadInitialData() {
        this.idleService.startWatching();
        const user = await this.supabase.getUser();
        if (!user) return;
        const userId = user.id;
        const profile = await this.userService.getProfile(userId);
        if (!profile) return;
        this.cache.set('profile', profile);
        const roleId = profile.role_id;
        const role = await this.roleService.getById(roleId);
        this.cache.set('role', role);
        await this.permissionService.loadByRole(roleId);
        const menus = await this.menuService.getMenusByUser(userId);
        this.cache.set('menus', menus);
        this.initRealtime(userId, roleId);
    }

    private initRealtime(userId: string, roleId: number) {
        this.supabase.listen('menu', () => {
            clearTimeout(this.menuDebounce);
            this.menuDebounce = setTimeout(async () => {
                const menus = await this.menuService.getMenusByUser(userId);
                this.cache.set('menus', menus);
            }, 300);
        });

        this.supabase.listen('role_menu_permission_relationship_map', () => {
            clearTimeout(this.permissionDebounce);
            this.permissionDebounce = setTimeout(async () => {
                await this.permissionService.loadByRole(roleId);
            }, 300);
        });

        this.supabase.listen('profiles', () => {
            clearTimeout(this.profileDebounce);
            this.profileDebounce = setTimeout(async () => {
                const profile = await this.userService.getProfile(userId);
                this.cache.set('profile', profile);
                if (profile?.role_id) {
                    const newRoleId = profile.role_id;
                    const role = await this.roleService.getById(newRoleId);
                    this.cache.set('role', role);
                    await this.permissionService.loadByRole(newRoleId);
                    roleId = newRoleId;
                }
            }, 300);
        });
    }

    ngOnDestroy() {
        this.supabase.removeAllListeners?.();
        clearTimeout(this.menuDebounce);
        clearTimeout(this.permissionDebounce);
        clearTimeout(this.profileDebounce);
    }
}