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
