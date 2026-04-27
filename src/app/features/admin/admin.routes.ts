import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
    // {
    //     path: 'profile',
    //     loadComponent: () => import('../profile/profile').then(m => m.Profile),
    // },
    {
        path: 'users',
        loadComponent: () => import('../users/users').then(m => m.Users),
    },
    {
        path: 'roles',
        loadComponent: () => import('../roles/roles').then(m => m.Roles),
    },
    {
        path: 'permissions',
        loadComponent: () => import('../permissions/permissions').then(m => m.Permissions),
    },
    {
        path: 'role-permissions',
        loadComponent: () => import('../role-permissions/role-permissions').then(m => m.RolePermissions),
    },
    {
        path: 'role-permissions/:roleId',
        loadComponent: () => import('../role-permissions/role-permissions').then(m => m.RolePermissions),
    },
    {
        path: 'menus',
        loadComponent: () => import('../menus/menus').then(m => m.Menus),
    },
];