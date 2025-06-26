export interface ISolicitudAtencion {
  _id?: string;
  codigoSolicitud: string; // Código interno, ej: SOL-LAB-00001
  cotizacionId: string;
  codPago: string;
  tipo: string;
  servicios: IServicioSolicitud[];
  hc: string;
  tipoDocumento: string;
  nroDocumento: string;
  pacienteNombre: string;
  fechaEmision: Date | string;
  estado: string;
  usuarioEmisor: string;
}

export interface IServicioSolicitud {
  servicioId: string;
  nombreServicio: string;
  codigoServicio: string;
  estado: string;
}

export interface ISolicitudAtencionPostDTO {
  cotizacionId: string;
  tipo: string;
  servicios: IServicioSolicitudPostDTO[];
  hc: string;
  tipoDocumento: string;
  nroDocumento: string;
  pacienteNombre: string;
  usuarioEmisor: string;
}

export interface IServicioSolicitudPostDTO {
  servicioId: string;
  nombreServicio: string;
  codigoServicio: string;
}

export interface IGetLastSolicitudesAtencion {
  ok: boolean;
  search: String;
  solicitudes: ISolicitudAtencion[];
}

export interface ISolicitudAtencionPostResponse {
  ok: boolean;
  msg?: string;
  errors?: string;
}
