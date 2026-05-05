import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { permissionGuard } from './core/guards/permission-guard';
import { AuthLayout } from './layouts/auth-layout/auth-layout';

export const routes: Routes = [
  // 🔓 Public Auth Routes
  {
    path: '',
    component: AuthLayout,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
      },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
      },
      {
        path: 'otp',
        loadComponent: () => import('./features/auth/otp/otp').then(m => m.Otp)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register').then(m => m.Register)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPassword)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/reset-password/reset-password').then(m => m.ResetPassword)
      }
    ]
  },

  // 🔐 Email confirmation
  {
    path: 'confirm-email',
    loadComponent: () => import('./features/auth/confirm-email/confirm-email').then(m => m.ConfirmEmail)
  },

  // 🔐 Protected App Area
  {
    path: 'app',
    loadComponent: () => import('./layouts/main-layout/main-layout').then(m => m.MainLayout),
    canMatch: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then(m => m.Profile)
      },

      // 🔐 Admin Module
      {
        path: 'admin',
        canMatch: [permissionGuard],
        data: { action: 'ADMIN_ACCESS' },
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
      }
    ]
  },

  // 🚫 Unauthorized page
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/components/unauthorized/unauthorized').then(m => m.Unauthorized)
  },

  // ❌ 404 page
  {
    path: '**',
    loadComponent: () => import('./shared/components/page-not-found/page-not-found').then(m => m.PageNotFound)
  }
];