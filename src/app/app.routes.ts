import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { adminGuard, authGuard, staffGuard } from './guards/auth.guard';

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
    path: 'team-vacations',
    canActivate: [authGuard, staffGuard],
    loadComponent: () =>
      import('./pages/team-vacations/team-vacations').then((m) => m.TeamVacations),
    title: 'Vacaciones del equipo',
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
    canActivate: [authGuard, staffGuard],
    loadComponent: () => import('./pages/employee-list/employee-list').then((m) => m.EmployeeList),
    title: 'Lista de empleados',
  },
  {
    path: 'branches',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/admin-branches/admin-branches').then((m) => m.AdminBranches),
    title: 'Sucursales',
  },
  {
    path: 'departments',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/admin-department/admin-department').then(m => m.AdminDepartment)
  },
  {
    path: 'positions',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/admin-positions/admin-positions').then((m) => m.AdminPositions),
    title: 'Puestos',
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
