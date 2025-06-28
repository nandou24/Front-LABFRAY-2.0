import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'pages',
    component: LayoutComponent,
    canActivateChild: [authGuard],
    children: [
      {
        path: 'pacientes',
        loadComponent: () =>
          import(
            './pages/pacientes/mant-pacientes-recepcion/mant-pacientes-recepcion.component'
          ).then((m) => m.MantPacientesRecepcionComponent),
      },
      {
        path: 'itemLab',
        loadComponent: () =>
          import(
            './pages/laboratorio/mant-item-lab/mant-item-lab.component'
          ).then((m) => m.MantItemLabComponent),
      },
      {
        path: 'pruebaLab',
        loadComponent: () =>
          import(
            './pages/laboratorio/mant-prueba-lab/mant-prueba-lab.component'
          ).then((m) => m.MantPruebaLabComponent),
      },
      {
        path: 'servicios',
        loadComponent: () =>
          import(
            './pages/servicios/mant-servicio/mant-servicio.component'
          ).then((m) => m.MantServicioComponent),
      },
      {
        path: 'recursoHumano',
        loadComponent: () =>
          import(
            './pages/recursoHumano/mant-recurso-humano/mant-recurso-humano.component'
          ).then((m) => m.MantRecursoHumanoComponent),
      },
      {
        path: 'referencia-medico',
        loadComponent: () =>
          import(
            './pages/referencias/referencia-medico/referencia-medico.component'
          ).then((m) => m.ReferenciaMedicoComponent),
      },
      {
        path: 'cotiPersona',
        loadComponent: () =>
          import(
            './pages/gestionar/cotizacion/gest-coti-persona/gest-coti-persona.component'
          ).then((m) => m.GestCotiPersonaComponent),
      },
      {
        path: 'pagoCotiPersona',
        loadComponent: () =>
          import(
            './pages/gestionar/pagos/gest-pago-coti-persona/gest-pago-coti-persona.component'
          ).then((m) => m.GestPagoCotiPersonaComponent),
      },
      {
        path: 'rutas',
        loadComponent: () =>
          import('./pages/permisos/rutas/rutas.component').then(
            (m) => m.RutasComponent,
          ),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./pages/permisos/roles/roles.component').then(
            (m) => m.RolesComponent,
          ),
      },
      {
        path: 'solicitudAtencion',
        loadComponent: () =>
          import(
            './pages/gestionar/solicitudAtencion/solicitud-atencion.component'
          ).then((m) => m.SolicitudAtencionComponent),
      },
    ],
  },
  {
    path: 'auth',
    //necesito cargar la pagina de login
    loadComponent: () =>
      import('./auth/login/login-policlinico/login-policlinico.component').then(
        (m) => m.LoginPoliclinicoComponent,
      ),
  },
  {
    path: 'no-autorizado',
    //necesito cargar la pagina de login
    loadComponent: () =>
      import('./pages/error/no-authorized/no-authorized.component').then(
        (m) => m.NoAuthorizedComponent,
      ),
  },
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
];
