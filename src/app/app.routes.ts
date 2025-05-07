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
          {
            path: 'itemLab',
            loadComponent: () =>
              import('./pages/laboratorio/mant-item-lab/mant-item-lab.component').then(m => m.MantItemLabComponent),
          },
          {
            path: 'pruebaLab',
            loadComponent: () =>
              import('./pages/laboratorio/mant-prueba-lab/mant-prueba-lab.component').then(m => m.MantPruebaLabComponent),
          },
          {
            path: 'servicios',
            loadComponent: () =>
              import('./pages/servicios/mant-servicio/mant-servicio.component').then(m => m.MantServicioComponent),
          },
          {
            path: 'recursoHumano',
            loadComponent: () =>
              import('./pages/recursoHumano/mant-recurso-humano/mant-recurso-humano.component').then(m => m.MantRecursoHumanoComponent),
          },
          // {
          //   path: '',
          //   redirectTo: 'home',
          //   pathMatch: 'full'
          // }
        ]
      }

];
