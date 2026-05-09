import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {

  const supabase = inject(SupabaseService);
  const router = inject(Router);

  try {

    // =========================
    // 1. CHECK SESSION
    // =========================
    const session = await supabase.getSession();

    if (!session?.user) {
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // =========================
    // 2. VALIDATE PROFILE
    // =========================
    const { data: profile, error } = await supabase.client
      .from('profiles')
      .select('id, is_active, organization_id, role_id')
      .eq('id', session.user.id)
      .single();

    // invalid user
    if (error || !profile) {
      await supabase.signOut();
      return router.createUrlTree(['/login']);
    }

    // =========================
    // 3. CHECK USER STATUS
    // =========================
    if (!profile.is_active) {
      await supabase.signOut();
      return router.createUrlTree(['/login']);
    }

    // =========================
    // 4. PASS
    // =========================
    return true;

  } catch (err) {

    await supabase.signOut();

    return router.createUrlTree(['/login']);
  }
};