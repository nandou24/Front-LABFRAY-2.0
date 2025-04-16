import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [

    {
        path: '',
        component: LayoutComponent,
        // children: [
        //   {
        //     path: 'home',
        //     loadComponent: () =>
        //       import('./pages/home/home.component').then(m => m.HomeComponent),
        //   },
        //   {
        //     path: 'pacientes',
        //     loadComponent: () =>
        //       import('./pages/pacientes/pacientes.component').then(m => m.PacientesComponent),
        //   },
        //   {
        //     path: '',
        //     redirectTo: 'home',
        //     pathMatch: 'full'
        //   }
        // ]
      }

];
