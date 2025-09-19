import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verifica si el token es válido y que no ha expirado
  const tokenValido = authService.tokenValido();

  if (!tokenValido) {
    return router.parseUrl('/auth');
  }

  //Devuelve la ruta solicitada (ejemplo: /pages/cotizaciones)
  const rutaSolicitada = state.url;

  // 🔥 SOLUCIÓN: Extraer solo la parte de la URL sin query parameters
  const rutaBase = rutaSolicitada.split('?')[0]; // Elimina query parameters como ?codCotizacion=123

  // Obtiene las rutas permitidas desde el token
  const datosToken = authService.obtenerRutasPermitidas();

  //Busca si la ruta solicitada está en las rutas permitidas
  const tienePermiso = datosToken?.some(
    (r) => r.urlRuta?.toLowerCase() === rutaBase.toLowerCase(),
  );

  //Si no está en las rutas permitidas, redirige a una página de acceso denegado
  if (!tienePermiso) {
    console.warn('❌ Acceso denegado a la ruta:', rutaBase);
    console.log(
      '📋 Rutas permitidas:',
      datosToken?.map((r) => r.urlRuta),
    );
    return router.parseUrl('/no-autorizado'); // Puedes crear un componente para mostrar acceso denegado
  }

  // Si el token es válido y la ruta está permitida, permite el acceso
  return true;
};
