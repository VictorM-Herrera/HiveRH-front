import { Routes } from '@angular/router';
import { Login } from './pages/login/login';

export const routes: Routes = [
    { path: '', component: Login, title:'Login'},
    { path: 'home', loadComponent: () => 
        import('./pages/home/home').then(m => m.Home),
        title: 'Home'
    },
    { path:'**', redirectTo:'', pathMatch:'full' }
];
