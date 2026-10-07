import {
  IEstadoOperativoSolicitud,
  IResumenResultadosEstadoOperativo,
} from './estadoOperativoSolicitud.models';

// ====== Tipos base ======

export type TipoResultadoLaboratorio = 'NUMERICO' | 'TEXTO' | 'CATEGORICO';

export type EstadoItemResultado =
  | 'PENDIENTE'
  | 'REGISTRADO'
  | 'VALIDADO'
  | 'ANULADO';

export type EstadoResultadoLaboratorio =
  | 'PENDIENTE'
  | 'EN PROCESO'
  | 'COMPLETO'
  | 'VALIDADO'
  | 'LIBERADO'
  | 'ANULADO';

export type EstadoEvaluacionReferencia =
  | 'PENDIENTE'
  | 'DENTRO_REFERENCIA'
  | 'FUERA_REFERENCIA'
  | 'BAJO'
  | 'ALTO'
  | 'VALOR_PERMITIDO'
  | 'VALOR_NO_PERMITIDO'
  | 'NO_APLICA';

export type TipoReferenciaLaboratorio =
  | 'RANGO'
  | 'MENOR_QUE'
  | 'MENOR_IGUAL_QUE'
  | 'MAYOR_QUE'
  | 'MAYOR_IGUAL_QUE'
  | 'VALORES_PERMITIDOS'
  | 'TEXTO';

export type NivelAlertaLaboratorio = 'INFORMATIVA' | 'ADVERTENCIA' | 'CRITICA';

export type CondicionAlertaLaboratorio =
  | 'MENOR_QUE'
  | 'MENOR_IGUAL_QUE'
  | 'MAYOR_QUE'
  | 'MAYOR_IGUAL_QUE'
  | 'FUERA_DE_RANGO'
  | 'IGUAL_A'
  | 'DISTINTO_DE';

// ====== Referencia aplicada ======

export interface IReferenciaAplicada {
  descripcion: string;

  sexo: 'TODOS' | 'MASCULINO' | 'FEMENINO';

  edadMin: number | null;
  edadMax: number | null;

  unidadEdad: 'DIAS' | 'MESES' | 'ANIOS';

  tipoReferencia: TipoReferenciaLaboratorio | null;

  valorMin: number | null;
  valorMax: number | null;
  valorLimite: number | null;

  valoresPermitidos: string[];

  textoReferencia: string;
}

// ====== Evaluación clínica ======

export interface IEvaluacionReferencia {
  estado: EstadoEvaluacionReferencia;

  referenciaAplicada: IReferenciaAplicada | null;

  mensaje: string;
}

// ====== Alertas ======

export interface IAlertaDetectada {
  descripcion: string;

  condicion: CondicionAlertaLaboratorio | null;

  valor1: string | number | null;
  valor2: string | number | null;

  nivelAlerta: NivelAlertaLaboratorio;

  mensaje: string;

  fechaDeteccion: string;
}


// ====== Configuración clínica histórica precargada ======

export interface IReferenciaResultadoSnapshot {
  descripcion: string;

  sexo: 'TODOS' | 'MASCULINO' | 'FEMENINO';

  edadMin: number | null;
  edadMax: number | null;

  unidadEdad: 'DIAS' | 'MESES' | 'ANIOS';

  tipoReferencia: TipoReferenciaLaboratorio;

  valorMin: number | null;
  valorMax: number | null;
  valorLimite: number | null;

  valoresPermitidos: string[];

  textoReferencia: string;

  activo: boolean;
}

export interface IReglaAlertaSnapshot {
  descripcion: string;

  sexo: 'TODOS' | 'MASCULINO' | 'FEMENINO';

  edadMin: number | null;
  edadMax: number | null;

  unidadEdad: 'DIAS' | 'MESES' | 'ANIOS';

  condicion: CondicionAlertaLaboratorio;

  valor1: string | number | null;
  valor2: string | number | null;

  nivelAlerta: NivelAlertaLaboratorio;

  mensaje: string;

  activo: boolean;
}

export interface IConfiguracionClinicaResultadoItem {
  tipoResultado: TipoResultadoLaboratorio;

  opcionesResultado: string[];

  valorPorDefectoResultado: string;

  permiteValorNoListado: boolean;

  referenciasResultado: IReferenciaResultadoSnapshot[];

  reglasAlerta: IReglaAlertaSnapshot[];
}

// ====== Item de resultado ======

export interface IResultadoLaboratorioItem {
  _id: string;

  claveItemResultado: string;

  indiceGrupo: number;
  indiceItem: number;

  nombreGrupo: string;

  ordenGrupo: number;
  ordenItem: number;

  itemLabId: string;

  codItemLab: string | null;

  nombreInforme: string;

  tipoResultado: TipoResultadoLaboratorio;

  unidadesRef: string;

  valor: string | number | null;

  observacion: string;

  estado: EstadoItemResultado;

  evaluacionReferencia: IEvaluacionReferencia;

  alertasDetectadas: IAlertaDetectada[];

  configuracionClinica?: IConfiguracionClinicaResultadoItem | null;

  registradoPor?: string | null;

  usuarioRegistroResultado?: string | null;

  fechaRegistroResultado?: string | null;

  actualizadoPor?: string | null;

  usuarioActualizacionResultado?: string | null;

  fechaActualizacionResultado?: string | null;
}

// ====== Habilitación por muestra ======

export type CodigoHabilitacionMuestraResultado =
  | 'MUESTRAS_ACEPTADAS'
  | 'MUESTRAS_NO_APTAS'
  | 'SIN_MUESTRAS'
  | 'NO_REQUIERE_MUESTRA'
  | 'UNIDAD_ANULADA';

export interface IMuestraHabilitacionResultado {
  claveMuestraPlan: string;

  numeroRecipiente: number | null;

  totalIntentos: number;

  muestraVigenteId: string | null;

  codMuestra: string | null;

  codigoEtiqueta: string | null;

  numeroIntento: number | null;

  estadoMuestra: string | null;

  esVigente: boolean;

  aceptada: boolean;
}

export interface IHabilitacionMuestraResultado {
  habilitada: boolean;

  codigo: CodigoHabilitacionMuestraResultado;

  requiereMuestra: boolean;

  claveUnidad: string;

  mensaje: string;

  resumen: {
    totalRecipientes: number;

    aceptados: number;

    pendientes: number;
  };

  muestras: IMuestraHabilitacionResultado[];
}


// ====== Historial del resultado ======

export type TipoEventoHistorialResultado =
  | 'INICIALIZACION'
  | 'REGISTRO'
  | 'MODIFICACION'
  | 'REVISION_VALIDACION'
  | 'VALIDACION'
  | 'LIBERACION'
  | 'ANULACION'
  | 'REAPERTURA';

export interface IHistorialEventoResultado {
  _id?: string;
  tipoEvento: TipoEventoHistorialResultado;
  versionResultado: number;
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  ejecutadoPor: string | null;
  usuarioEjecucion: string | null;
  fechaEvento: string;
  detalle: string;
  metadatos?: Record<string, unknown> | null;
  snapshotResultado?: Record<string, unknown> | null;
}

// ====== Resultado de laboratorio ======

export interface IResultadoLaboratorio {
  _id: string;

  solicitudAtencionId: string;

  codSolicitud: string;

  claveUnidad: string;

  pruebaLabId: string;

  codPruebaLab: string;

  nombrePruebaLab: string;

  numeroInstancia: number;

  etiquetaInstancia: string | null;

  resultadosItems: IResultadoLaboratorioItem[];

  observacionGeneral: string;

  estadoResultado: EstadoResultadoLaboratorio;

  estadoUnidadLaboratorio?: string | null;

  habilitacionMuestra: IHabilitacionMuestraResultado | null;

  // ====== Validación ======

  validadoPor?: string | null;

  usuarioValidacion?: string | null;

  fechaValidacion?: string | null;

  observacionValidacion?: string;

  confirmoAlertasCriticasValidacion?: boolean;

// ====== Liberación ======

  liberadoPor?: string | null;

  usuarioLiberacion?: string | null;

  fechaLiberacion?: string | null;

  confirmoAlertasCriticasLiberacion?: boolean;

  // ====== Anulación ======

  estadoPrevioAnulacion?: Exclude<EstadoResultadoLaboratorio, 'ANULADO'> | null;

  anuladoPor?: string | null;

  usuarioAnulacion?: string | null;

  fechaAnulacion?: string | null;

  motivoAnulacion?: string | null;

  autorizacionAnulacionPor?: string | null;

  usuarioAutorizacionAnulacion?: string | null;

  rolAutorizacionAnulacion?: string | null;

  fechaAutorizacionAnulacion?: string | null;

  // ====== Versionado e historial ======

  versionResultado?: number;

  historialEventos?: IHistorialEventoResultado[];

  // ====== Auditoría ======

  createdBy: string;

  usuarioRegistro?: string | null;

  fechaRegistro?: string | null;

  updatedBy?: string | null;

  usuarioActualizacion?: string | null;

  fechaActualizacion?: string | null;

  createdAt?: string;

  updatedAt?: string;
}

// ====== Resúmenes ======

export interface IResumenEstadosResultado {
  total: number;

  pendientes: number;

  enProceso: number;

  completos: number;

  validados: number;

  liberados: number;

  anulados: number;

  habilitadosPorMuestra?: number;

  bloqueadosPorMuestra?: number;
}

export interface IResumenAlertas {
  total: number;

  informativas: number;

  advertencias: number;

  criticas: number;
}

// ====== Consulta por solicitud ======

export interface IResultadosPorSolicitudResponse {
  ok: boolean;

  msg: string;

  solicitudAtencionId: string;

  codSolicitud: string;

  estadoSolicitud: string;

  estadoOperativo: IEstadoOperativoSolicitud;

  resumen: IResumenEstadosResultado;

  resultados: IResultadoLaboratorio[];
}

// ====== Consulta por id ======

export interface IResultadoPorIdResponse {
  ok: boolean;

  msg: string;

  estadoSolicitud: string;

  estadoOperativo: IEstadoOperativoSolicitud;

  resumenAlertas: IResumenAlertas;

  resultado: IResultadoLaboratorio;
}

// ====== Resultados liberados ======

export interface IPacienteResultadoLiberado {
  hc: string | null;

  clienteId: string | null;

  tipoDoc: string | null;

  nroDoc: string | null;

  nombreCliente: string | null;

  apePatCliente: string | null;

  apeMatCliente: string | null;

  sexoPaciente: string | null;

  fechaNacimientoPaciente: string | null;
}

export interface ISolicitudResultadoLiberado {
  _id: string;

  codSolicitud: string;

  estado: string;

  estadoOperativo: IEstadoOperativoSolicitud;

  fechaEmision: string;

  paciente: IPacienteResultadoLiberado;
}

export interface IResumenResultadosLiberados {
  totalLiberados: number;

  totalAlertas: number;

  informativas: number;

  advertencias: number;

  criticas: number;
}

export interface IResultadosLiberadosResponse {
  ok: boolean;

  msg: string;

  solicitud: ISolicitudResultadoLiberado;

  resumen: IResumenResultadosLiberados;

  resultados: IResultadoLaboratorio[];
}

// ====== Inicialización ======

export interface IInicializarResultadosResponse {
  ok: boolean;

  msg: string;

  estadoSolicitud: string;

  estadoOperativo: IEstadoOperativoSolicitud;

  resumen: {
    unidadesLaboratorio: number;

    unidadesActivas?: number;

    unidadesAnuladas?: number;

    resultadosCreados: number;

    resultadosExistentes: number;
  };

  resultados: IResultadoLaboratorio[];
}

// ====== Captura individual ======

export interface IRegistrarResultadoItemDTO {
  valor: string | number;

  observacion?: string;
}

export interface IRegistrarResultadoItemResponse {
  ok: boolean;

  msg: string;

  estadoResultado: EstadoResultadoLaboratorio;

  estadoUnidadLaboratorio: string | null;

  estadoSolicitud: string;

  estadoOperativo: IEstadoOperativoSolicitud;

  habilitacionMuestra?: IHabilitacionMuestraResultado;

  item: IResultadoLaboratorioItem;

  versionResultado?: number;
  historialEventos?: IHistorialEventoResultado[];
}

// ====== Captura masiva ======

export interface IResultadoMasivoItemDTO {
  itemResultadoId: string;

  valor: string | number;

  observacion?: string;
}

export interface IRegistrarResultadosMasivosDTO {
  items: IResultadoMasivoItemDTO[];
}

export interface IRegistrarResultadosMasivosResponse {
  ok: boolean;

  msg: string;

  estadoResultado: EstadoResultadoLaboratorio;

  estadoUnidadLaboratorio: string | null;

  estadoSolicitud: string;

  estadoOperativo: IEstadoOperativoSolicitud;

  habilitacionMuestra?: IHabilitacionMuestraResultado;

  itemsActualizados: number;

  items: IResultadoLaboratorioItem[];

  versionResultado?: number;
  historialEventos?: IHistorialEventoResultado[];
}

// ====== Validación ======

export interface IValidarResultadoDTO {
  observacionValidacion?: string;

  confirmarAlertasCriticas?: boolean;
}

export interface IValidarResultadoResponse {
  ok: boolean;

  msg: string;

  estadoResultado: EstadoResultadoLaboratorio;

  estadoUnidadLaboratorio: string | null;

  estadoSolicitud: string;

  estadoOperativo: IEstadoOperativoSolicitud;

  resumenAlertas: IResumenAlertas;

  resultado: IResultadoLaboratorio;
}

// ====== Validación masiva ======

export interface IValidarResultadosMasivosDTO {
  resultadoIds: string[];
  observacionValidacion?: string;
  confirmarAlertasCriticas?: boolean;
}

export interface IValidarResultadosMasivosResponse {
  ok: boolean;
  msg: string;
  estadoSolicitud: string;
  estadoOperativo: IEstadoOperativoSolicitud;
  resumenAlertas: IResumenAlertas;
  resultados: IResultadoLaboratorio[];
}

// ====== Liberación ======

export interface ILiberarResultadoDTO {
  confirmarAlertasCriticas?: boolean;
}

export interface ILiberarResultadoResponse {
  ok: boolean;

  msg: string;

  estadoResultado: EstadoResultadoLaboratorio;

  estadoUnidadLaboratorio: string | null;

  estadoSolicitud: string;

  estadoOperativo: IEstadoOperativoSolicitud;

  resumenAlertas: IResumenAlertas;

  resultado: IResultadoLaboratorio;
}


// ====== Bandeja de Gestión de Resultados ======

export type OrigenAtencionBandejaResultado = 'PARTICULAR' | 'EMPRESA';

export interface IPacienteBandejaResultado {
  hc: string | null;

  clienteId: string | null;

  tipoDoc: string | null;

  nroDoc: string | null;

  nombreCliente: string;

  apePatCliente: string;

  apeMatCliente: string;

  sexoPaciente: string | null;

  fechaNacimientoPaciente: string | null;
}

export interface IEmpresaBandejaResultado {
  programacionEmpresaId: string | null;

  codProgramacion: string | null;

  empresaId: string | null;

  rucEmpresa: string | null;

  razonSocialEmpresa: string;

  sede: string | null;

  prioridad: string | null;

  tipoEvaluacion: string | null;

  tipoAtencion: string | null;

  estadoProgramacion: string | null;
}

export interface ISolicitudBandejaResultado {
  _id: string;

  codSolicitud: string;

  codigoLaboratorio: string | null;

  origenAtencion: OrigenAtencionBandejaResultado;

  tipo: string;

  estado: string;

  estadoOperativo: IEstadoOperativoSolicitud;

  fechaEmision: string;

  paciente: IPacienteBandejaResultado;

  empresa: IEmpresaBandejaResultado | null;
}

export interface IResultadosBandejaSolicitud {
  inicializados: boolean;

  totalDocumentos: number;

  resumen: IResumenResultadosEstadoOperativo | null;

  detalle: IResultadoLaboratorio[];
}

export interface IBandejaResultadosLaboratorioItem {
  solicitud: ISolicitudBandejaResultado;

  resultados: IResultadosBandejaSolicitud;
}

export interface IResumenBandejaResultadosLaboratorio {
  totalSolicitudes: number;

  particulares: number;

  empresas: number;

  pendientesMuestras: number;

  resultadosDisponiblesParcialmente: number;

  atendidos: number;

  resultadosInicializadosEnBandeja?: number;
}

export interface IBandejaResultadosLaboratorioResponse {
  ok: boolean;

  msg: string;

  resumen: IResumenBandejaResultadosLaboratorio;

  solicitudes: IBandejaResultadosLaboratorioItem[];
}

// ====== Anulación ======

export interface IAnularResultadoDTO {
  motivoAnulacion: string;

  nombreUsuarioAutorizador?: string;

  passwordAutorizador?: string;
}

export interface IAutorizacionAnulacionResultado {
  autorizacionAnulacionPor: string;

  usuarioAutorizacionAnulacion: string;

  rolAutorizacionAnulacion: string | null;

  fechaAutorizacionAnulacion: string;
}

export interface IAnularResultadoResponse {
  ok: boolean;

  msg: string;

  estadoPrevioAnulacion: Exclude<EstadoResultadoLaboratorio, 'ANULADO'>;

  estadoResultado: 'ANULADO';

  estadoUnidadLaboratorio: string | null;

  estadoSolicitud: string;

  estadoOperativo: IEstadoOperativoSolicitud;

  motivoAnulacion: string;

  autorizacionSegundoUsuario: IAutorizacionAnulacionResultado | null;

  resultado: IResultadoLaboratorio;
}
// ====== Reapertura ======

export interface IReabrirResultadoResponse {
  ok: boolean;
  msg: string;
  estadoResultado: EstadoResultadoLaboratorio;
  estadoUnidadLaboratorio: string | null;
  estadoSolicitud: string;
  estadoOperativo: IEstadoOperativoSolicitud;
  resultado: IResultadoLaboratorio;
}

