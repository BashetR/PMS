import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  // 🔓 Public Routes
  {
    path: '',
    pathMatch: "full",
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.Register),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPassword),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password').then(m => m.ResetPassword),
  },
  {
    path: 'confirm-email',
    loadComponent: () => import('./features/auth/confirm-email/confirm-email').then(m => m.ConfirmEmail),
  },

  // 🔐 Protected Routes (IMPORTANT)
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./shared/components/profile/profile').then(m => m.Profile),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [authGuard]
  },
  // {
  //   path: 'users',
  //   loadComponent: () => import('./features/users/users').then(m => m.Users),
  //   canActivate: [authGuard]
  // },

  // ❌ 404
  {
    path: '**',
    loadComponent: () => import('./shared/components/page-not-found/page-not-found').then(m => m.PageNotFound)
  }
];