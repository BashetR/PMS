import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { RoleService } from '../services/role.service';
import { CacheService } from '../services/cache.service';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {

    constructor(
        private supabase: SupabaseService,
        private roleService: RoleService,
        private cache: CacheService,
        private router: Router
    ) { }

    async canActivate(route: ActivatedRouteSnapshot): Promise<boolean | any> {

        // =========================
        // 1. GET USER (SAFE)
        // =========================
        const user = await this.cache.get<any>('auth_user')
            ?? await this.supabase.getUser();

        if (!user) {
            return this.router.createUrlTree(['/login']);
        }

        this.cache.set('auth_user', user);

        // =========================
        // 2. GET ROLE (CACHED SERVICE)
        // =========================
        const profile = await this.cache.get<any>(`profile_${user.id}`);

        const roleData = profile?.role_id
            ? await this.roleService.getById(profile.role_id)
            : null;

        const roleName = roleData?.role_name;

        // =========================
        // 3. SAFE ROLE CHECK
        // =========================
        const allowedRoles = route.data['roles'] as string[];

        if (!allowedRoles || !roleName || !allowedRoles.includes(roleName)) {
            return this.router.createUrlTree(['/unauthorized']);
        }

        return true;
    }
}