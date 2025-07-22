export interface ISolicitudAtencion {
  _id?: string;
  codSolicitud: string; // Código interno, ej: SOL-LAB-00001
  codCotizacion: string;
  codPago: string;
  tipo: string;
  servicios: IServicioSolicitud[];
  hc: string;
  tipoDocumento: string;
  nroDocumento: string;
  clienteId: string;
  nombreCliente: string;
  apePatCliente: string;
  apeMatCliente: string;
  fechaEmision: Date | string;
  estado: string;
  usuarioEmisor: string;
}

export interface IServicioSolicitud {
  codigoServicio: string;
  nombreServicio: string;
  estado: string;
  medicoAtiende?: {
    medicoId: string;
    codRecHumano: string;
    apePatRecHumano: string;
    apeMatRecHumano: string;
    nomRecHumano: string;
    nroColegiatura: string;
    rne: string;
  };
}

export interface ISolicitudAtencionPostDTO {
  codCotizacion: string;
  tipo: string;
  servicios: IServicioSolicitudPostDTO[];
  hc: string;
  tipoDocumento: string;
  nroDocumento: string;
  clienteId: string;
  nombreCliente: string;
  apePatCliente: string;
  apeMatCliente: string;
  usuarioEmisor: string;
}

export interface IServicioSolicitudPostDTO {
  codigoServicio: string;
  nombreServicio: string;
  estado: string;
  medicoAtiende?: {
    medicoId: string;
    codRecHumano: string;
    apePatRecHumano: string;
    apeMatRecHumano: string;
    nomRecHumano: string;
    nroColegiatura: string;
    rne: string;
  };
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
