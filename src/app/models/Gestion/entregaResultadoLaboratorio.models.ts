// ====== Contratos exclusivos del módulo de Recepción ======
export interface IPacienteEntrega {
  pacienteId?: string | null;
  nombreCompleto: string;
  hc: string;
  documento: string;
}

export interface IResumenEntrega {
  totalPruebas: number;
  liberados: number;
  pendientes: number;
  tipoDisponibilidad: 'SIN_VIGENTES' | 'PARCIAL' | 'COMPLETA';
}

export interface IFilaEntrega {
  solicitudAtencionId: string;
  codSolicitud: string;
  codigoLaboratorio: string;
  fechaEmision: string;
  origenAtencion: 'PARTICULAR' | 'EMPRESA';
  paciente: IPacienteEntrega;
  resumen: IResumenEntrega;
  tieneHistorial: boolean;
}

export interface IBandejaEntregaResponse {
  ok: boolean;
  bandeja: IFilaEntrega[];
  total: number;
}

export interface IItemInformeEntrega {
  nombreInforme: string;
  codItemLab: string | null;
  valor: string | number | null;
  unidadesRef: string;
  observacion: string;
  ordenGrupo: number;
  ordenItem: number;
  evaluacionReferencia?: {
    estado?: string;
    referenciaAplicada?: { descripcion?: string } | null;
  } | null;
  alertasDetectadas?: Array<{ nivelAlerta: string; mensaje: string }>;
}

export interface IPruebaInformeEntrega {
  _id: string;
  codPruebaLab: string;
  nombrePruebaLab: string;
  numeroInstancia: number;
  etiquetaInstancia: string | null;
  versionResultado: number;
  fechaLiberacion: string | null;
  usuarioLiberacion: string | null;
  observacionGeneral: string;
  items: IItemInformeEntrega[];
}

export interface IEntregaRegistrada {
  _id: string;
  tipoEntrega: 'PARCIAL' | 'FINAL';
  medio: 'PRESENCIAL' | 'WHATSAPP' | 'CORREO' | 'OTRO';
  receptorNombre: string;
  fechaEntrega: string;
  usuarioEntrega: string;
  pruebasEntregadas: number;
}

export interface IInformeEntregable {
  ok: boolean;
  solicitud: {
    solicitudAtencionId: string;
    codSolicitud: string;
    codigoLaboratorio: string | null;
    fechaEmision: string;
    origenAtencion: 'PARTICULAR' | 'EMPRESA';
    paciente: IPacienteEntrega;
  };
  resumen: IResumenEntrega;
  resultados: IPruebaInformeEntrega[];
  entregas: IEntregaRegistrada[];
}

export interface IRegistrarEntregaBody {
  resultadosIds: string[];
  receptorNombre?: string;
  medio: 'PRESENCIAL' | 'WHATSAPP' | 'CORREO' | 'OTRO';
  observacion?: string;
}

export interface IRegistroEntregaResponse {
  ok: boolean;
  msg: string;
  entregaId: string;
  tipoEntrega: 'PARCIAL' | 'FINAL';
  pruebasEntregadas: number;
  fechaEntrega: string;
}
