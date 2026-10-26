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
  fechaNacimiento?: Date | string | null;
  puesto?: string;
  area?: string;

  // Si ya existe como paciente formal
  pacienteId?: string | null;
  hc?: string | null;
  identidadTemporalActiva?: boolean;
  fechaRegularizacionIdentidad?: string | Date | null;
  accionDocumentoPaciente?: 'REGULARIZAR' | 'CORREGIR' | null;

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


// ====== Gestión documental de pacientes ya vinculados ======
export interface ICambioDocumentoPaciente {
  campo: 'tipoDoc' | 'nroDoc';
  valorAnterior: string | null;
  valorNuevo: string | null;
}

export interface IHistorialDocumentoPaciente {
  fecha: Date | string;
  tipoOperacion: 'REGULARIZACION' | 'CORRECCION_AUTORIZADA' | string;
  tipoDocAnterior?: string | null;
  nroDocAnterior?: string | null;
  tipoDocNuevo?: string | null;
  nroDocNuevo?: string | null;
  motivo?: string | null;
  uid?: string | null;
  nombreUsuario?: string | null;
  autorizadoPor?: string | null;
  usuarioAutorizacion?: string | null;
  rolAutorizacion?: string | null;
  cambios: ICambioDocumentoPaciente[];
}

export interface IVerificacionDocumentoHC {
  ok: boolean;
  msg?: string;
  tipoDoc: TipoDocumentoProgramacion;
  nroDoc: string;
  hayCoincidencias: boolean;
  masResultados: boolean;
  candidatos: Array<{
    pacienteId: string;
    hc: string | null;
    nombreCompleto: string;
    coincidencia: 'DOCUMENTO_ACTUAL' | 'HISTORIAL_DOCUMENTO';
  }>;
}

export interface IRegularizarDocumentoProgramacionRequest {
  tipoDoc: TipoDocumentoProgramacion;
  nroDoc: string;
  motivo: string;
  identidadConfirmada: boolean;
}

export interface ICorregirDocumentoProgramacionRequest extends IRegularizarDocumentoProgramacionRequest {
  nombreUsuarioAutorizador: string;
  passwordAutorizador: string;
}

export interface IRegularizarDocumentoProgramacionResponse {
  ok: boolean;
  msg?: string;
  codigo?: string;
  programacion?: IProgramacionEmpresa;
  paciente?: { _id: string; hc: string };
  coincidencias?: IVerificacionDocumentoHC | null;
}

export interface IHistorialDocumentoProgramacionResponse {
  ok: boolean;
  hc?: string;
  historial: IHistorialDocumentoPaciente[];
  msg?: string;
}

// ====== Importación Excel: conservar el contrato previo ======
export interface IFilaValidacionImportacion {
  filaExcel: number;
  empresaId: string;
  protocoloId: string;
  datos: Record<string, string>;
}

export interface IResultadoValidacionImportacion {
  filaExcel: number;
  estado: 'CORRECTO' | 'REVISAR' | 'BLOQUEADO';
  errores: string[];
  advertencias: string[];
  paciente: {
    estado: 'NUEVO' | 'HC_COINCIDE' | 'IDENTIDAD_DIFERENTE' | 'COINCIDENCIA_NOMBRE' | string;
    pacienteId?: string | null;
    hc?: string | null;
    datosMaestros?: {
      tipoDoc: string;
      nroDoc: string;
      nombreCliente: string;
      apePatCliente: string;
      apeMatCliente: string;
      sexoCliente?: string | null;
      fechaNacimiento?: string | Date | null;
    } | null;
  };
}

export interface IValidacionMasivaProgramacionesResponse {
  ok: boolean;
  msg?: string;
  resumen: {
    total: number;
    correctos: number;
    revisar: number;
    bloqueados: number;
  };
  resultados: IResultadoValidacionImportacion[];
}

export interface IFilaRegistroImportacion extends IFilaValidacionImportacion {
  confirmada: boolean;
  advertenciasOriginales: string[];
}

export interface IResultadoRegistroImportacion {
  filaExcel: number;
  estado: string;
  codProgramacion?: string | null;
  hc?: string | null;
  errores?: string[];
}

export interface IRespuestaRegistroImportacion {
  ok: boolean;
  msg?: string;
  resultados: IResultadoRegistroImportacion[];
}
