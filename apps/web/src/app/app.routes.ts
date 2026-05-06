import type { Routes } from '@angular/router';
import { authGuard, guestGuard, verifiedGuard } from './core/guards/auth.guard';
import { ShellComponent } from './shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'reset-password/:token',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: 'verify-email/:token',
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email.component').then(
        (m) => m.VerifyEmailComponent,
      ),
  },
  {
    path: 'signup',
    children: [
      {
        path: '',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/signup/signup.component').then((m) => m.SignupComponent),
      },
      {
        path: 'verify-email-sent',
        loadComponent: () =>
          import('./features/auth/verify-email-sent/verify-email-sent.component').then(
            (m) => m.VerifyEmailSentComponent,
          ),
      },
    ],
  },
  {
    path: 'dashboard',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard, verifiedGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/list/projects-list.component').then(
            (m) => m.ProjectsListComponent,
          ),
      },
      {
        path: 'projects/new',
        loadComponent: () =>
          import('./features/projects/form/project-form.component').then(
            (m) => m.ProjectFormComponent,
          ),
      },
      {
        path: 'projects/:id/edit',
        loadComponent: () =>
          import('./features/projects/form/project-form.component').then(
            (m) => m.ProjectFormComponent,
          ),
      },
      {
        path: 'projects/:projectId/tables/new',
        loadComponent: () =>
          import('./features/projects/tables/form/table-form.component').then(
            (m) => m.TableFormComponent,
          ),
      },
      {
        path: 'projects/:projectId/tables/:tableId/edit',
        loadComponent: () =>
          import('./features/projects/tables/form/table-form.component').then(
            (m) => m.TableFormComponent,
          ),
      },
      {
        path: 'projects/:projectId/tables/:tableId',
        loadComponent: () =>
          import('./features/projects/tables/detail/table-detail.component').then(
            (m) => m.TableDetailComponent,
          ),
      },
      {
        path: 'projects/:id',
        loadComponent: () =>
          import('./features/projects/detail/project-detail.component').then(
            (m) => m.ProjectDetailComponent,
          ),
      },
      {
        path: 'settings/profile',
        loadComponent: () =>
          import('./features/settings/profile/profile.component').then((m) => m.ProfileComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
