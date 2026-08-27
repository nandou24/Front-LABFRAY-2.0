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

  tipoDoc: string;
  nroDoc: string;
  nombreCliente: string;
  apePatCliente: string;
  apeMatCliente: string;
  sexoCliente?: 'Masculino' | 'Femenino';
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
