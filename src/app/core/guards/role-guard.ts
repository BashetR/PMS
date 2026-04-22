import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Injectable({
    providedIn: 'root'
})

export class RoleGuard implements CanActivate {

    constructor(private supabase: SupabaseService, private router: Router) { }

    async canActivate(): Promise<boolean> {
        const { data: auth } = await this.supabase.client.auth.getUser();
        if (!auth?.user) {
            this.router.navigate(['/login']);
            return false;
        }

        const { data: profile } = await this.supabase.client
            .from('profiles')
            .select('role')
            .eq('id', auth.user.id)
            .single();

        if (!profile) {
            this.router.navigate(['/login']);
            return false;
        }

        const isAdmin = profile.role === 'Admin';

        if (!isAdmin) {
            this.router.navigate(['/unauthorized']);
            return false;
        }

        return true;
    }
}