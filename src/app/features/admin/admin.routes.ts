import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
    {
        path: 'users',
        loadComponent: () => import('../users/users').then(m => m.Users)
    },
    {
        path: 'dashboard',
        loadComponent: () => import('../dashboard/dashboard').then(m => m.Dashboard),
    },
    {
        path: 'profile',
        loadComponent: () => import('../profile/profile').then(m => m.Profile),
    }
];