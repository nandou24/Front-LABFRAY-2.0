// ====== Contratos exclusivos del módulo de Recepción ======
export interface IPacienteEntrega {
  pacienteId?: string | null;
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  nombreCompleto: string;
  nombreInforme?: string;
  hc: string;
  documento: string;
  sexo?: string | null;
  fechaNacimiento?: string | null;
}

export interface IEmpresaEntrega {
  programacionEmpresaId?: string | null;
  codProgramacion?: string | null;
  empresaId?: string | null;
  rucEmpresa?: string | null;
  razonSocialEmpresa: string;
  sede?: string | null;
  prioridad?: string | null;
  protocoloId?: string | null;
  codProtocolo?: string | null;
  nombreProtocolo?: string | null;
}

export interface IResumenEntrega {
  totalPruebas: number;
  liberados: number;
  pendientes: number;
  tipoDisponibilidad: 'SIN_VIGENTES' | 'PARCIAL' | 'COMPLETA';
  pendientesMuestra?: number;
  enProceso?: number;
  completos?: number;
  validados?: number;
  enPlazo?: number;
  proximosVencer?: number;
  vencenHoy?: number;
  vencidos?: number;
  fueraPlazo?: number;
  semaforoPlazo?:
    | 'EN_PLAZO'
    | 'PROXIMO'
    | 'HOY'
    | 'VENCIDO'
    | 'SIN_FECHA'
    | 'FINALIZADO';
}

export interface IEstadoMuestraSeguimientoEntrega {
  estado:
    | 'NO_REQUIERE'
    | 'PENDIENTE'
    | 'RECOLECTADA'
    | 'RECEPCIONADA'
    | 'ACEPTADA'
    | 'RECHAZADA'
    | string;
  descripcion: string;
  pendiente: boolean;
  fechaAceptacion?: string | null;
  motivo?: string | null;
}

export interface IPruebaSeguimientoEntrega {
  claveUnidad: string;
  codPruebaLab: string;
  nombrePruebaLab: string;
  numeroInstancia: number;
  etiquetaInstancia?: string | null;
  estadoResultado:
    | 'PENDIENTE'
    | 'EN PROCESO'
    | 'COMPLETO'
    | 'VALIDADO'
    | 'LIBERADO'
    | 'ANULADO'
    | string;
  fechaValidacion?: string | null;
  fechaLiberacion?: string | null;
  tiempoRespuesta?: string | null;
  diasRespuesta?: number | null;
  fechaEstimada?: string | null;
  estadoPlazo:
    | 'EN_PLAZO'
    | 'PROXIMO'
    | 'HOY'
    | 'VENCIDO'
    | 'SIN_FECHA'
    | 'FINALIZADO'
    | string;
  etiquetaPlazo: string;
  fueraPlazo: boolean;
  situacion: string;
  muestra: IEstadoMuestraSeguimientoEntrega;
}

export interface IFilaEntrega {
  solicitudAtencionId: string;
  codSolicitud: string;
  codigoLaboratorio: string;
  fechaEmision: string;
  origenAtencion: 'PARTICULAR' | 'EMPRESA';
  paciente: IPacienteEntrega;
  empresa?: IEmpresaEntrega | null;
  resumen: IResumenEntrega;
  pruebas: IPruebaSeguimientoEntrega[];
  tieneHistorial: boolean;
}

export interface IBandejaEntregaResponse {
  ok: boolean;
  bandeja: IFilaEntrega[];
  total: number;
}

export interface IReferenciaAplicadaEntrega {
  descripcion?: string;
  sexo?: string;
  edadMin?: number | null;
  edadMax?: number | null;
  unidadEdad?: 'DIAS' | 'MESES' | 'ANIOS' | string;
  tipoReferencia?:
    | 'RANGO'
    | 'MENOR_QUE'
    | 'MENOR_IGUAL_QUE'
    | 'MAYOR_QUE'
    | 'MAYOR_IGUAL_QUE'
    | 'VALORES_PERMITIDOS'
    | 'TEXTO'
    | string
    | null;
  valorMin?: number | null;
  valorMax?: number | null;
  valorLimite?: number | null;
  valoresPermitidos?: string[];
  textoReferencia?: string;
}


export type ValorCuantificacionInformeEntrega =
  | string
  | number
  | { tipo: 'RANGO'; desde: number; hasta: number }
  | {
      tipo:
        | 'MAYOR_QUE'
        | 'MAYOR_IGUAL_QUE'
        | 'MENOR_QUE'
        | 'MENOR_IGUAL_QUE';
      valor: number;
    }
  | { tipo: 'CATEGORICO'; valor: string }
  | { tipo: 'CUALITATIVO'; valor: string };

export interface IHallazgoInformeEntrega {
  hallazgo: string;
  valor: ValorCuantificacionInformeEntrega;
}

export interface IValorEstructuradoInformeEntrega {
  tipo: 'HALLAZGOS';
  modo: 'AUSENCIA' | 'DETALLE';
  valorAusencia?: string;
  hallazgos: IHallazgoInformeEntrega[];
}

export type ValorInformeEntrega =
  | ValorCuantificacionInformeEntrega
  | IValorEstructuradoInformeEntrega
  | null;

export interface IItemInformeEntrega {
  nombreInforme: string;
  codItemLab: string | null;
  tipoResultado?: 'NUMERICO' | 'TEXTO' | 'CATEGORICO' | 'ESTRUCTURADO';
  muestra?: string | null;
  metodo?: string | null;
  nombreGrupo?: string | null;
  comentarioReferenciaGrupo?: string | null;
  mostrarReferenciaInforme?: boolean;
  hallazgosNormales?: string[];
  valor: ValorInformeEntrega;
  unidadesRef: string;
  observacion: string;
  ordenGrupo: number;
  ordenItem: number;
  evaluacionReferencia?: {
    estado?: string;
    referenciaAplicada?: IReferenciaAplicadaEntrega | null;
  } | null;
  referenciasConfiguradas?: IReferenciaAplicadaEntrega[];
  alertasDetectadas?: Array<{ nivelAlerta: string; mensaje: string }>;
}

export interface IPruebaInformeEntrega {
  _id: string;
  codPruebaLab: string;
  nombrePruebaLab: string;
  numeroInstancia: number;
  etiquetaInstancia: string | null;
  versionResultado: number;
  fechaValidacion?: string | null;
  muestras?: string[];
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
    fechaAtencion?: string | null;
    origenAtencion: 'PARTICULAR' | 'EMPRESA';
    paciente: IPacienteEntrega;
    empresa?: IEmpresaEntrega | null;
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
