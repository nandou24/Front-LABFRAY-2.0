// ====== Tipos generales ======

export type EstadoLaboratorioReferencia = 'ACTIVO' | 'INACTIVO';

export type TipoContactoLaboratorioReferencia =
  | 'CENTRAL_PROGRAMACION'
  | 'AREA_LABORATORIO'
  | 'SECTORISTA'
  | 'FACTURACION'
  | 'OTRO';

// ====== Contacto ======

export interface IContactoLaboratorioReferencia {
  _id?: string;

  tipoContacto: TipoContactoLaboratorioReferencia;

  nombreContacto?: string;

  cargo?: string;

  telefono?: string;

  correo?: string;

  principal?: boolean;

  observacion?: string;
}

// ====== Laboratorio de referencia ======

export interface ILaboratorioReferencia {
  _id?: string;

  codLaboratorioReferencia?: string;

  nombreLaboratorio: string;

  razonSocial?: string;

  ruc?: string;

  codigoCliente?: string;

  direccion?: string;

  contactos?: IContactoLaboratorioReferencia[];

  observacion?: string;

  estadoLaboratorioReferencia: EstadoLaboratorioReferencia;

  // ====== Auditoría ======

  createdBy?: string;

  usuarioRegistro?: string;

  fechaRegistro?: string | Date;

  updatedBy?: string;

  usuarioActualizacion?: string;

  fechaActualizacion?: string | Date;

  createdAt?: string | Date;

  updatedAt?: string | Date;
}

// ====== Respuesta crear / actualizar ======

export interface ILaboratorioReferenciaResponseDTO {
  ok: boolean;

  msg?: string;

  laboratorioReferencia: ILaboratorioReferencia;
}

// ====== Respuesta listado ======

export interface IGetLaboratoriosReferencia {
  ok: boolean;

  total: number;

  laboratoriosReferencia: ILaboratorioReferencia[];
}
