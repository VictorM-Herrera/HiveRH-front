import { Routes } from '@angular/router';
import { Login } from './pages/login/login';

export const routes: Routes = [
  { path: '', component: Login, title: 'Login' },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
    title: 'Inicio',
  },
  {
    path: 'my-account',
    loadComponent: () => import('./pages/my-account/my-account').then((m) => m.MyAccount),
    title: 'Mi cuenta',
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
