export type EstadoProgramacion =
  | 'PROGRAMADO'
  | 'EN ATENCION'
  | 'PENDIENTE DE COMPLETAR'
  | 'ATENDIDO'
  | 'NO ASISTIO'
  | 'CANCELADO';

export type TipoDocumentoProgramacion = 'DNI' | 'CE' | 'PASAPORTE';

export type TurnoProgramacion = 'MAÑANA' | 'TARDE' | 'NOCHE';

export type TipoPendiente = 'MUESTRA' | 'EVALUACION' | 'DOCUMENTO' | 'OTRO';

export type SedeProgramacion = 'Callao' | 'Comas' | 'NoIndica';

export type TipoEvaluacionProgramacion =
  | 'ETAs'
  | 'Ocupacional'
  | 'PreOcupacional'
  | 'Retiro'
  | 'Toxicológico'
  | 'Otro';

export type TipoAtencionProgramacion = 'Regular' | 'Preferencial' | 'VIP';

export type PrioridadProgramacion = 'Normal' | 'Alta';

export type TipoDiasPlazoProgramacion = 'HABILES' | 'CALENDARIO';

export interface PlazoResultadosProgramacion {
  cantidadDias: number;
  tipoDias: TipoDiasPlazoProgramacion;
}

export interface ServicioProgramado {
  servicioId: string;
  codServicio: string;
  nombreServicio: string;
  tipoServicio: string;
}

export interface PendienteProgramacion {
  tipo: TipoPendiente;
  servicioId?: string;
  codServicio?: string;
  nombreServicio?: string;
  descripcion: string;
  fechaRegistro?: Date | string;
  fechaResolucion?: Date | string;
  resuelto?: boolean;
}

export interface IProgramacionEmpresa {
  _id?: string;

  // Código generado por el sistema
  codProgramacion?: string;

  // EMPRESA

  empresaId: string;
  rucEmpresa: string;
  razonSocialEmpresa: string;
  nombreComercialEmpresa?: string;

  // DATOS DEL PACIENTE

  tipoDoc: string | null;
  nroDoc: string | null;
  nombreCliente: string;
  apePatCliente: string;
  apeMatCliente: string;
  sexoCliente?: 'Masculino' | 'Femenino' | null;
  fechaNacimiento?: Date | string;
  puesto?: string;
  area?: string;

  // Si ya existe como paciente formal
  pacienteId?: string | null;
  hc?: string | null;

  // PROTOCOLO

  protocoloId: string;
  codProtocolo: string;
  nombreProtocolo: string;

  // Snapshot del compromiso del protocolo
  plazoResultados?: PlazoResultadosProgramacion | null;

  // Snapshot de los servicios
  serviciosProgramados: ServicioProgramado[];

  // PROGRAMACIÓN

  fechaProgramada: Date | string;
  turno?: TurnoProgramacion;
  horaProgramada?: string;
  sede?: SedeProgramacion;
  tipoEvaluacion?: TipoEvaluacionProgramacion;
  tipoAtencion?: TipoAtencionProgramacion;
  prioridad?: PrioridadProgramacion;

  // ESTADO

  estadoProgramacion: EstadoProgramacion;
  estadoIdentificacionPaciente?: 'PENDIENTE' | 'REGISTRADA' | null;
  pendientes?: PendienteProgramacion[];

  // ATENCIÓN

  fechaInicioAtencion?: Date | string | null;
  fechaUltimaAtencion?: Date | string | null;
  fechaFinalizacion?: Date | string | null;

  // OTROS

  observaciones?: string;
  origenRegistro?: 'MANUAL' | 'IMPORTACION_EXCEL';
}

export interface IProgramacionPostDTO {
  ok: boolean;
  msg?: string;
  errors?: string;
  programacion?: IProgramacionEmpresa;
}

export interface IGetProgramaciones {
  ok: boolean;
  search?: string;
  programaciones: IProgramacionEmpresa[];
}

export interface IGetProgramacionById {
  ok: boolean;
  search?: string;
  programacion: IProgramacionEmpresa;
}

export interface IListarProgramacionesQuery {
  empresaId?: string;
  estadoProgramacion?: EstadoProgramacion;
  nroDoc?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface IRegularizarDocumentoProgramacionRequest {
  tipoDoc: TipoDocumentoProgramacion;
  nroDoc: string;
  motivo: string;
}

export interface IRegularizarDocumentoProgramacionResponse {
  ok: boolean;
  msg?: string;
  codigo?: string;
  programacion?: IProgramacionEmpresa;
  paciente?: { _id: string; hc: string; estadoIdentificacion: string };
}

// ====== Revisión masiva previa al registro ======
export type EstadoValidacionImportacion = 'CORRECTO' | 'REVISAR' | 'BLOQUEADO';

export interface IFilaValidacionImportacion {
  filaExcel: number;
  empresaId: string;
  protocoloId: string;
  datos: {
    rucEmpresa: string; razonSocialEmpresa: string;
    codProtocolo: string; nombreProtocolo: string;
    fechaProgramada: string; sede: string;
    tipoEvaluacion: string; tipoAtencion: string; prioridad: string;
    apePatCliente: string; apeMatCliente: string; nombreCliente: string;
    tipoDoc: string; nroDoc: string; sexoCliente: string;
    fechaNacimiento: string; observaciones: string;
  };
}

export interface IResultadoValidacionImportacion {
  filaExcel: number;
  estado: EstadoValidacionImportacion;
  errores: string[];
  advertencias: string[];
  empresa: { _id: string; ruc: string; razonSocial: string } | null;
  protocolo: { _id: string; codigoProtocolo: string; nombreProtocolo: string } | null;
  paciente: {
    estado: 'NUEVO' | 'HC_COINCIDE' | 'IDENTIDAD_DIFERENTE' | 'DUPLICADO_DOCUMENTO' | 'SIN_DOCUMENTO' | 'COINCIDENCIA_NOMBRE';
    hc: string | null;
    pacienteId: string | null;
    nombreCompleto: string | null;
    // Datos disponibles solo cuando el documento identifica una única HC.
    datosMaestros?: {
      tipoDoc: string; nroDoc: string;
      apePatCliente: string; apeMatCliente: string; nombreCliente: string;
      sexoCliente: string; fechaNacimiento: string; // Fecha ISO yyyy-MM-dd
    } | null;
  };
}

export interface IValidacionMasivaProgramacionesResponse {
  ok: boolean;
  soloValidacion: true;
  fechaValidacion: string;
  resultados: IResultadoValidacionImportacion[];
  resumen: { total: number; correctos: number; revisar: number; bloqueados: number };
}

// ====== Registro por lotes con trazabilidad ======
export interface IFilaRegistroImportacion extends IFilaValidacionImportacion {
  confirmada: boolean;
  advertenciasOriginales: string[];
}

export interface IResultadoRegistroImportacion {
  filaExcel: number;
  estado: 'REGISTRADA' | 'YA_REGISTRADA';
  codProgramacion: string;
  programacionId: string;
  hc: string | null;
}

export interface IRespuestaRegistroImportacion {
  ok: boolean;
  importacionId: string;
  creadas: number;
  previamenteRegistradas: number;
  resultados: IResultadoRegistroImportacion[];
}
