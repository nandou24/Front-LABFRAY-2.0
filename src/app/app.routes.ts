import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [

    {
        path: '',
        component: LayoutComponent,
        children: [
          // {
          //   path: 'home',
          //   loadComponent: () =>
          //     import('./pages/home/home.component').then(m => m.HomeComponent),
          // },
          {
            path: 'pacientes',
            loadComponent: () =>
              import('./pages/pacientes/mant-pacientes-recepcion/mant-pacientes-recepcion.component').then(m => m.MantPacientesRecepcionComponent),
          },
          // {
          //   path: '',
          //   redirectTo: 'home',
          //   pathMatch: 'full'
          // }
        ]
      }

];
