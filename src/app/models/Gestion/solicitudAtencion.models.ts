export type OrigenAtencion = 'PARTICULAR' | 'EMPRESA';

export interface IProgramacionEmpresaSolicitud {
  _id: string;

  codProgramacion: string;

  empresaId: string;
  rucEmpresa: string;
  razonSocialEmpresa: string;

  pacienteId?: string | null;
  hc?: string | null;

  tipoDoc?: string;
  nroDoc?: string;

  nombreCliente?: string;
  apePatCliente?: string;
  apeMatCliente?: string;

  protocoloId: string;
  codProtocolo: string;
  nombreProtocolo: string;

  sede?: string;
  tipoEvaluacion?: string;
  tipoAtencion?: string;
  prioridad?: string;

  estadoProgramacion?: string;
}

export interface ISolicitudAtencion {
  _id?: string;
  codSolicitud: string;
  origenAtencion: OrigenAtencion;

  // ==========================================
  // PARTICULAR
  // ==========================================

  cotizacionId?: string | null;
  codCotizacion?: string | null;
  pagoId?: any | null;
  codPago?: string | null;

  // ==========================================
  // EMPRESA
  // ==========================================

  programacionEmpresaId?: IProgramacionEmpresaSolicitud | string | null;
  codProgramacion?: string | null;
  empresaId?: string | null;
  razonSocialEmpresa?: string | null;
  protocoloId?: string | null;
  codProtocolo?: string | null;
  nombreProtocolo?: string | null;

  // ==========================================
  // SOLICITUD
  // ==========================================

  tipo: string;
  servicios: IServicioSolicitud[];
  hc: string;
  tipoDoc: string;
  nroDoc: string;
  clienteId: string;
  nombreCliente: string;
  apePatCliente: string;
  apeMatCliente: string;
  solicitanteId?: any | null;
  fechaEmision: Date | string;
  estado: string;
  usuarioEmisor?: string;
}

export interface IServicioSolicitud {
  servicioId: string;
  codServicio: string;
  nombreServicio: string;
  estado: string;
  medicoAtiende?: {
    medicoId: string;
    codRecHumano: string;
    apePatRecHumano: string;
    apeMatRecHumano: string;
    nombreRecHumano: string;
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
