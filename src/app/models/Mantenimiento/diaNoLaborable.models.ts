export type EstadoDiaNoLaborable = 'ACTIVO' | 'INACTIVO';

export type TipoDiaNoLaborable =
  | 'FERIADO_NACIONAL'
  | 'FERIADO_LOCAL'
  | 'CIERRE_INSTITUCIONAL'
  | 'OTRO';

export interface IDiaNoLaborable {
  _id?: string;
  fecha: string;
  anio?: number;
  descripcion: string;
  tipo: TipoDiaNoLaborable;
  observacion?: string;
  estadoDiaNoLaborable: EstadoDiaNoLaborable;

  createdBy?: string;
  usuarioRegistro?: string;
  fechaRegistro?: string | Date;
  updatedBy?: string;
  usuarioActualizacion?: string;
  fechaActualizacion?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IGetDiasNoLaborables {
  ok: boolean;
  total: number;
  diasNoLaborables: IDiaNoLaborable[];
}

export interface IDiaNoLaborableResponseDTO {
  ok: boolean;
  msg?: string;
  diaNoLaborable: IDiaNoLaborable;
}
