export interface ITuboEnvase {
  _id?: string;

  codTuboEnvase?: string;
  nombreTuboEnvase: string;
  descripcionTuboEnvase?: string;

  color?: string;
  aditivo?: string;

  capacidad?: number | null;
  unidadCapacidad?: string | null;

  estadoTuboEnvase?: 'ACTIVO' | 'INACTIVO';

  createdBy?: string;
  usuarioRegistro?: string;
  fechaRegistro?: Date;

  updatedBy?: string;
  usuarioActualizacion?: string;
  fechaActualizacion?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITuboEnvaseResponseDTO {
  ok: boolean;
  msg: string;
  tuboEnvase: ITuboEnvase;
}

export interface IGetTubosEnvases {
  ok: boolean;
  total: number;
  tubosEnvases: ITuboEnvase[];
}
