import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { RbacService } from '../services/rbac.service';

export const permissionGuard: CanMatchFn = (route, segments) => {
    const rbac = inject(RbacService);
    const router = inject(Router);

    if (!rbac.isInitialized()) {
        return router.createUrlTree(['/login']);
    }

    if (!rbac.user()) {
        return router.createUrlTree(['/login']);
    }

    const url = '/' + segments.map(s => s.path).join('/');

    const menu = rbac.menus().find(m =>
        url.startsWith(m.route) // safer matching
    );

    if (!menu) {
        return router.createUrlTree(['/unauthorized']);
    }

    const action = route.data?.['action'] ?? 'view';

    if (!rbac.hasPermission(menu.id, action)) {
        return router.createUrlTree(['/unauthorized']);
    }

    return true;
};