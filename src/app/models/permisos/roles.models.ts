import { IRuta } from './rutas.models';

export interface IRol {
  _id: string;
  codRol: string; // Código único (ej. 'ROL001')
  nombreRol: string; // Ej. 'Administrador', 'Recepción', etc.
  descripcionRol?: string; // Detalle del rol y sus funciones
  estado: boolean; // ACTIVO / INACTIVO
  rutasPermitidas: IRuta[]; // rutas asignadas al rol
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
