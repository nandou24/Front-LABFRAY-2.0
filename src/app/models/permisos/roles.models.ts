import { IRuta } from './rutas.models';

export type PermisoAccion =
  | 'RESULTADOS_REGISTRAR'
  | 'RESULTADOS_VALIDAR'
  | 'RESULTADOS_LIBERAR'
  | 'RESULTADOS_ANULAR';

export interface IRol {
  _id: string;
  codRol: string;
  nombreRol: string;
  descripcionRol?: string;
  estado: boolean;
  rutasPermitidas: IRuta[];
  permisosAcciones?: PermisoAccion[];
}

export interface IRolPostDTO {
  ok: boolean;
  msg?: string;
  errors?: string;
}

export interface IGetLastRoles {
  ok: boolean;
  roles: IRol[];
}
