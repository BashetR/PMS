import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  // 🔓 Public Routes (Auth)
  {
    path: '',
    pathMatch: 'full',
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

  // 🔐 Protected Layout
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout').then(m => m.MainLayout),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then(m => m.Profile),
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/users').then(m => m.Users),
      },
      // {
      //   path: 'admin',
      //   loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
      // }
    ]
  },

  // ❌ 404
  {
    path: '**',
    loadComponent: () => import('./shared/components/page-not-found/page-not-found').then(m => m.PageNotFound)
  }
];