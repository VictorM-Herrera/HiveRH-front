import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { authGuard, staffGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Login, title: 'Login' },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
    title: 'Inicio',
  },
  {
    path: 'my-account',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/my-account/my-account').then((m) => m.MyAccount),
    title: 'Mi cuenta',
  },
  {
    path: 'my-vacations',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/my-vacations/my-vacations').then((m) => m.MyVacations),
    title: 'Mis vacaciones',
  },
  {
    path: 'my-licenses',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/my-licenses/my-licenses').then((m) => m.MyLicenses),
    title: 'Mis licencias',
  },
  {
    path: 'team-licenses',
    canActivate: [authGuard, staffGuard],
    loadComponent: () => import('./pages/team-licenses/team-licenses').then((m) => m.TeamLicenses),
    title: 'Licencias del equipo',
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile').then((m) => m.Profile),
    title: 'Mi perfil',
  },
  {
    path: 'profile/:dni',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile').then((m) => m.Profile),
    title: 'Perfil de empleado',
  },
  {
    path: 'employee-list',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/employee-list/employee-list').then(m => m.EmployeeList)
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
