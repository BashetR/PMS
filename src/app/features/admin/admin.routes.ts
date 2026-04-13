import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
    {
        path: 'users',
        loadComponent: () => import('../users/users/users').then(m => m.Users)
    }
];