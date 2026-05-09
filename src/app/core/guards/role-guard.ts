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

        try {

            // =========================
            // 1. GET USER (SAFE)
            // =========================
            const user =
                await this.cache.get<any>('auth_user')
                ?? await this.supabase.getUser();

            if (!user) {
                return this.router.createUrlTree(['/login']);
            }

            this.cache.set('auth_user', user);

            // =========================
            // 2. GET PROFILE (MUST BE RELIABLE)
            // =========================
            let profile =
                await this.cache.get<any>(`profile_${user.id}`);

            if (!profile) {

                const { data } = await this.supabase.client
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                profile = data;

                if (profile) {
                    this.cache.set(`profile_${user.id}`, profile);
                }
            }

            if (!profile) {
                await this.supabase.signOut();
                return this.router.createUrlTree(['/login']);
            }

            // =========================
            // 3. CHECK ROLE ID (ROBUST)
            // =========================
            const allowedRoles = route.data['roles'] as number[];

            if (!allowedRoles || !allowedRoles.length) {
                return true; // no restriction
            }

            if (!allowedRoles.includes(profile.role_id)) {
                return this.router.createUrlTree(['/unauthorized']);
            }

            // =========================
            // 4. OPTIONAL: ORGANIZATION SAFETY
            // =========================
            // const routeOrgId = route.data['organization_id'];

            // if (routeOrgId && profile.organization_id !== routeOrgId) {
            //     return this.router.createUrlTree(['/unauthorized']);
            // }

            return true;

        } catch (err) {

            await this.supabase.signOut();

            return this.router.createUrlTree(['/login']);
        }
    }
}