import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { RoleService } from '../services/role.service';
import { CacheService } from '../services/cache.service';

@Injectable({ providedIn: 'root' })

export class RoleGuard implements CanActivate {

    constructor(private supabase: SupabaseService, private roleService: RoleService, private cache: CacheService, private router: Router) { }

    async canActivate(route: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {
        const user =
            (await this.cache.get<any>('auth_user')) ??
            (await this.supabase.getUser());

        if (!user) {
            return this.router.createUrlTree(['/login']);
        }

        this.cache.set('auth_user', user);

        const profile =
            (await this.cache.get<any>(`profile_${user.id}`)) ??
            null;

        const roleData = profile?.role_id
            ? await this.roleService.getById(profile.role_id)
            : null;

        const roleName = roleData?.role_name;

        const allowedRoles = route.data?.['roles'] as string[] | undefined;

        if (!allowedRoles?.length || !roleName) {
            return this.router.createUrlTree(['/unauthorized']);
        }

        if (!allowedRoles.includes(roleName)) {
            return this.router.createUrlTree(['/unauthorized']);
        }

        return true;
    }
}