export interface ITipoMuestra {
  _id?: string;

  codTipoMuestra?: string;
  nombreTipoMuestra: string;
  descripcionTipoMuestra?: string;

  estadoTipoMuestra?: 'ACTIVO' | 'INACTIVO';

  createdBy?: string;
  usuarioRegistro?: string;
  fechaRegistro?: Date;

  updatedBy?: string;
  usuarioActualizacion?: string;
  fechaActualizacion?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITipoMuestraResponseDTO {
  ok: boolean;
  msg: string;
  tipoMuestra: ITipoMuestra;
}

export interface IGetTiposMuestra {
  ok: boolean;
  total: number;
  tiposMuestra: ITipoMuestra[];
}
