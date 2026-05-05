import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { RbacService } from '../services/rbac.service';

export const authGuard: CanMatchFn = (route, state) => {
  const rbac = inject(RbacService);
  const router = inject(Router);

  if (!rbac.isInitialized()) {
    return router.createUrlTree(['/login']); // or a loading page
  }

  if (!rbac.user()) {
    return router.createUrlTree(['/login']);
  }

  return true;
};