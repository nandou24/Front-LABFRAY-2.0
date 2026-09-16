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

  condicion:
    | 'MENOR_QUE'
    | 'MENOR_IGUAL_QUE'
    | 'MAYOR_QUE'
    | 'MAYOR_IGUAL_QUE'
    | 'FUERA_DE_RANGO'
    | 'IGUAL_A'
    | 'DISTINTO_DE'
    | null;

  valor1: string | number | null;
  valor2: string | number | null;

  nivelAlerta: NivelAlertaLaboratorio;

  mensaje: string;

  fechaDeteccion: string;
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

  registradoPor?: string | null;

  usuarioRegistroResultado?: string | null;

  fechaRegistroResultado?: string | null;

  actualizadoPor?: string | null;

  usuarioActualizacionResultado?: string | null;

  fechaActualizacionResultado?: string | null;
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

  // ====== Validación ======

  validadoPor?: string | null;

  usuarioValidacion?: string | null;

  fechaValidacion?: string | null;

  observacionValidacion?: string;

  // ====== Liberación ======

  liberadoPor?: string | null;

  usuarioLiberacion?: string | null;

  fechaLiberacion?: string | null;

  // ====== Anulación ======

  estadoPrevioAnulacion?: Exclude<EstadoResultadoLaboratorio, 'ANULADO'> | null;

  anuladoPor?: string | null;

  usuarioAnulacion?: string | null;

  fechaAnulacion?: string | null;

  motivoAnulacion?: string | null;

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

  resumen: IResumenEstadosResultado;

  resultados: IResultadoLaboratorio[];
}

// ====== Consulta por id ======

export interface IResultadoPorIdResponse {
  ok: boolean;

  msg: string;

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

  resumen: {
    unidadesLaboratorio: number;

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

  item: IResultadoLaboratorioItem;
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

  itemsActualizados: number;

  items: IResultadoLaboratorioItem[];
}

// ====== Validación ======

export interface IValidarResultadoDTO {
  observacionValidacion?: string;
}

export interface IValidarResultadoResponse {
  ok: boolean;

  msg: string;

  estadoResultado: EstadoResultadoLaboratorio;

  resumenAlertas: IResumenAlertas;

  resultado: IResultadoLaboratorio;
}

// ====== Liberación ======

export interface ILiberarResultadoResponse {
  ok: boolean;

  msg: string;

  estadoResultado: EstadoResultadoLaboratorio;

  resumenAlertas: IResumenAlertas;

  resultado: IResultadoLaboratorio;
}

// ====== Anulación ======

export interface IAnularResultadoDTO {
  motivoAnulacion: string;
}

export interface IAnularResultadoResponse {
  ok: boolean;

  msg: string;

  estadoPrevioAnulacion: Exclude<EstadoResultadoLaboratorio, 'ANULADO'>;

  estadoResultado: 'ANULADO';

  motivoAnulacion: string;

  resultado: IResultadoLaboratorio;
}
